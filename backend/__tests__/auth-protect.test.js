const request = require('supertest')
const app = require('../src/index')
let server
beforeAll((done)=>{ server = app.listen(0, done) })
afterAll((done)=>{ server.close(done) })

test('protected endpoints require auth', async ()=>{
  const r = await request(app).get('/documents')
  expect(r.statusCode).toBe(401)

  const profile = await request(app).post('/profiles').send({ user_id: 'u-123', name: 'Test User' })
  expect(profile.statusCode).toBe(401)

  const medicines = await request(app).post('/medicines').send({ profile_id: 'p-123', name: 'Vitamin D' })
  expect(medicines.statusCode).toBe(401)
})

test('protected endpoints accept valid token', async ()=>{
  const email = `test+${Date.now()}@example.com`
  await request(app).post('/auth/register').send({ email, password: 'pass123' })
  const login = await request(app).post('/auth/login').send({ email, password: 'pass123' })
  const token = login.body.token
  const r = await request(app).get('/documents').set('Authorization', `Bearer ${token}`)
  expect([200,200]).toContain(r.statusCode)

  const profile = await request(app).post('/profiles').set('Authorization', `Bearer ${token}`).send({ user_id: login.body.user.id, name: 'Test User' })
  expect(profile.statusCode).toBe(201)
})
