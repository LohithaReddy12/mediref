const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let Database;
try {
  const sqlite = require('node:sqlite');
  Database = sqlite.DatabaseSync;
} catch (e) {
  Database = require('better-sqlite3');
}

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, 'medref.db');
const db = new Database(dbPath);

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

// Auth middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'authorization required' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = { userId: payload.sub, email: payload.email };
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Initialize tables (add columns if missing for backward compatibility)
db.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT);
CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, user_id TEXT, name TEXT, dob TEXT);
CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, profile_id TEXT, filename TEXT, mime TEXT, created_at TEXT, ocr_text TEXT, ingest_status TEXT);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT, token TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, profile_id TEXT, name TEXT, dosage TEXT, start_date TEXT, end_date TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS visits (id TEXT PRIMARY KEY, profile_id TEXT, date TEXT, provider TEXT, reason TEXT, notes TEXT);
CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, event TEXT, payload TEXT, created_at TEXT);
`);

// ensure password column for users
try {
  const info = db.prepare("PRAGMA table_info(users)").all();
  const cols = info.map(r=>r.name);
  if (!cols.includes('password_hash')) db.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run();
} catch (e) {}

// Ensure legacy DBs get the new columns
try {
  const info = db.prepare("PRAGMA table_info(documents)").all();
  const cols = info.map(r=>r.name);
  if (!cols.includes('ocr_text')) db.prepare('ALTER TABLE documents ADD COLUMN ocr_text TEXT').run();
  if (!cols.includes('ingest_status')) db.prepare('ALTER TABLE documents ADD COLUMN ingest_status TEXT').run();
} catch (e) {
  // ignore
}

const { fakeEmbeddings } = require('./lib')

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: path.join(DATA_DIR, 'uploads') });

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/documents', authMiddleware, upload.single('file'), (req, res) => {
  const { profile_id } = req.body;
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'file required' });
  const id = uuidv4();
  // ensure files dir
  const FILES_DIR = path.join(DATA_DIR, 'files');
  if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });
  const ext = path.extname(file.originalname) || '';
  const dest = path.join(FILES_DIR, id + ext);
  fs.renameSync(file.path, dest);
  const stmt = db.prepare('INSERT INTO documents (id, profile_id, filename, mime, created_at) VALUES (?,?,?,?,?)');
  stmt.run(id, profile_id || null, file.originalname, file.mimetype, new Date().toISOString());
  res.status(201).json({ id });
});

// protect document list and retrieval
app.get('/documents', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
  res.json(rows);
});

app.get('/documents/:id', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

app.get('/documents/:id/download', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const FILES_DIR = path.join(DATA_DIR, 'files');
  // try to find a matching file by id prefix
  const files = fs.readdirSync(FILES_DIR || path.join(DATA_DIR, ''));
  const found = files.find(f => f.startsWith(req.params.id));
  if (!found) return res.status(404).json({ error: 'file not found' });
  const full = path.join(FILES_DIR, found);
  res.download(full, row.filename);
});

// Simple register/login (no password hashing for scaffold) — replace for production
app.post('/auth/register', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const id = uuidv4();
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    db.prepare('INSERT INTO users (id, email, name, password_hash) VALUES (?,?,?,?)').run(id, email, name || null, hash);
    res.status(201).json({ id, email });
  } catch (e) {
    res.status(400).json({ error: 'could not create user' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'not found' });
  const ok = await bcrypt.compare(password || '', user.password_hash || '');
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

// Profiles
app.post('/profiles', authMiddleware, (req, res) => {
  const { user_id, name, dob } = req.body;
  if (!user_id || !name) return res.status(400).json({ error: 'user_id and name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO profiles (id, user_id, name, dob) VALUES (?,?,?,?)').run(id, user_id, name, dob || null);
  res.status(201).json({ id, user_id, name, dob });
});

app.get('/profiles', authMiddleware, (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  const rows = db.prepare('SELECT * FROM profiles WHERE user_id = ?').all(user_id);
  res.json(rows);
});

// Medicines
app.post('/medicines', authMiddleware, (req, res) => {
  const { profile_id, name, dosage, start_date, end_date, notes } = req.body;
  if (!profile_id || !name) return res.status(400).json({ error: 'profile_id and name required' });
  const id = uuidv4();
  db.prepare('INSERT INTO medicines (id, profile_id, name, dosage, start_date, end_date, notes) VALUES (?,?,?,?,?,?,?)').run(id, profile_id, name, dosage || null, start_date || null, end_date || null, notes || null);
  res.status(201).json({ id });
});

app.get('/medicines', authMiddleware, (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
  const rows = db.prepare('SELECT * FROM medicines WHERE profile_id = ?').all(profile_id);
  res.json(rows);
});

// Visits
app.post('/visits', authMiddleware, (req, res) => {
  const { profile_id, date, provider, reason, notes } = req.body;
  if (!profile_id || !date) return res.status(400).json({ error: 'profile_id and date required' });
  const id = uuidv4();
  db.prepare('INSERT INTO visits (id, profile_id, date, provider, reason, notes) VALUES (?,?,?,?,?,?)').run(id, profile_id, date, provider || null, reason || null, notes || null);
  res.status(201).json({ id });
});

app.get('/visits', authMiddleware, (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
  const rows = db.prepare('SELECT * FROM visits WHERE profile_id = ? ORDER BY date DESC').all(profile_id);
  res.json(rows);
});

// Timeline: combined documents and visits for a profile, sorted by date desc
app.get('/timeline', authMiddleware, (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id required' });
  const docs = db.prepare('SELECT id, filename, created_at FROM documents WHERE profile_id = ?').all(profile_id);
  const visits = db.prepare('SELECT id, date, provider, reason FROM visits WHERE profile_id = ?').all(profile_id);
  const items = [];
  docs.forEach(d => {
    items.push({ kind: 'document', id: d.id, title: d.filename, date: d.created_at });
  });
  visits.forEach(v => {
    items.push({ kind: 'visit', id: v.id, title: v.provider || 'Visit', date: v.date, reason: v.reason });
  });
  items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  res.json(items);
});

// Ingest (OCR) - mock implementation for prototype
app.post('/documents/:id/ingest', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  // mark ingest started
  db.prepare('UPDATE documents SET ingest_status = ? WHERE id = ?').run('started', req.params.id);
  // locate stored file
  const FILES_DIR = path.join(DATA_DIR, 'files');
  let found = null;
  try {
    const files = fs.readdirSync(FILES_DIR || path.join(DATA_DIR, ''));
    found = files.find(f => f.startsWith(req.params.id));
  } catch (e) {
    // ignore
  }
  if (!found) {
    db.prepare('UPDATE documents SET ingest_status = ? WHERE id = ?').run('failed', req.params.id);
    return res.status(404).json({ error: 'file not found' });
  }
  // produce a mock OCR text (replace with real OCR pipeline)
  const ocrText = `Mock OCR for ${row.filename}: This text is a placeholder for extracted contents.`;
  db.prepare('UPDATE documents SET ocr_text = ?, ingest_status = ? WHERE id = ?').run(ocrText, 'completed', req.params.id);
  res.status(202).json({ status: 'started', id: req.params.id });
});

app.get('/documents/:id/ocr', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT id, filename, ocr_text, ingest_status FROM documents WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json({ id: row.id, filename: row.filename, ocr_text: row.ocr_text, ingest_status: row.ingest_status });
});

// Webhook receiver (stores event payloads)
app.post('/webhooks', (req, res) => {
  const { event, payload } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO webhooks (id, event, payload, created_at) VALUES (?,?,?,?)').run(id, event || 'unknown', JSON.stringify(payload || {}), new Date().toISOString());
  res.status(201).json({ id });
});

// Agent runner stub — executes a simple job against a profile (e.g., check for upcoming follow-ups)
app.post('/agent/run', authMiddleware, (req, res) => {
  const { profile_id, action } = req.body;
  const id = uuidv4();
  const payload = { profile_id, action, result: `Agent performed ${action} for profile ${profile_id}` };
  db.prepare('INSERT INTO webhooks (id, event, payload, created_at) VALUES (?,?,?,?)').run(id, 'agent.run', JSON.stringify(payload), new Date().toISOString());
  res.json({ id, status: 'queued', payload });
});

app.get('/webhooks', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT * FROM webhooks ORDER BY created_at DESC').all();
  res.json(rows);
});

// Search and assistant endpoints (protected)
app.post('/search/semantic', authMiddleware, (req, res) => {
  const { profile_id, query, top_k } = req.body;
  const docs = db.prepare('SELECT id, filename, created_at FROM documents WHERE profile_id = ?').all(profile_id);
  const results = docs.filter(d => (d.filename && d.filename.toLowerCase().includes((query||'').toLowerCase()))).slice(0, top_k || 10).map(d=>({ id: d.id, score: 1.0, snippet: d.filename }));
  res.json({ results });
});

app.post('/assistant/query', authMiddleware, (req, res) => {
  const { profile_id, query } = req.body;
  const docs = db.prepare('SELECT id, filename FROM documents WHERE profile_id = ?').all(profile_id);
  const matched = docs.filter(d => d.filename && d.filename.toLowerCase().includes((query||'').toLowerCase())).slice(0,5);
  const sources = matched.map(m=>({ id: m.id, filename: m.filename }));
  const summary = `I found ${sources.length} document(s) that mention "${query}". I can extract dates, medications, and follow-up notes from these documents. I am not a doctor and cannot provide medical advice.`;
  res.json({ summary, sources, disclaimer: 'This assistant provides information only and is not a medical professional.' });
});

module.exports = app

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`MedRef backend running on ${PORT}`));
}
