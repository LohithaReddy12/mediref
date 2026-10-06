import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { setToken, getToken, removeToken, initAuth } from './auth'
import Workspace from './Workspace'

function LegacyApp(){
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('')
  const [user, setUser] = useState(null)

  useEffect(()=>{ initAuth(); const t=getToken(); if(t) setView('dashboard') },[])
  useEffect(()=>{ if(view === 'dashboard' && !getToken()){ removeToken(); setUser(null); setView('login') } },[view])

  async function login(e){
    e.preventDefault();
    const password = document.getElementById('password')?.value
    const res = await axios.post('http://localhost:4000/auth/login',{ email, password }).catch(()=>null)
    if(res && res.data){ setUser(res.data.user); setToken(res.data.token); setView('dashboard') }
  }

  if(view === 'login'){
    return (
      <div className="app">
        <header className="top">MedRef — Demo</header>
        <main style={{padding:24}}>
          <h2>Sign in</h2>
          <form onSubmit={login}>
            <label>Email</label><br/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
            <br/>
            <label>Password</label><br/>
            <input id="password" type="password" placeholder="password" />
            <div style={{marginTop:12}}>
              <button type="submit">Sign in</button>
              <button type="button" onClick={()=>setView('register')} style={{marginLeft:8}}>Register</button>
            </div>
          </form>
        </main>
      </div>
    )
  }

  if(view === 'register'){
    const [name,setName]=useState('')
    async function register(e){
      e.preventDefault();
      const password = document.getElementById('reg-password')?.value
      const res = await axios.post('http://localhost:4000/auth/register',{ email, name, password }).catch(()=>null)
      if(res) setView('login')
    }
    return (
      <div className="app">
        <header className="top">MedRef — Demo</header>
        <main style={{padding:24}}>
          <h2>Register</h2>
          <form onSubmit={register}>
            <label>Name</label><br/>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" />
            <label style={{marginTop:8}}>Email</label><br/>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
            <br/>
            <label>Password</label><br/>
            <input id="reg-password" type="password" placeholder="password" />
            <div style={{marginTop:12}}>
              <button type="submit">Create account</button>
              <button type="button" onClick={()=>setView('login')} style={{marginLeft:8}}>Back</button>
            </div>
          </form>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="top">MedRef — Demo</header>
      <main style={{padding:24}}>
        <h2>Welcome {user?.name || user?.email}</h2>
        <button onClick={()=>{ removeToken(); setUser(null); setView('login') }}>Logout</button>
        <Upload user={user} />
        <DocumentsList />
        <Medicines />
        <Visits />
        <Timeline />
        <SearchAssistant />
        <AgentUI />
      </main>
    </div>
  )
}

export default function App(){
  return <Workspace />
}

function Upload({user}){
  const [file,setFile]=useState(null)
  const [profileId,setProfileId]=useState('')
  async function send(e){
    e.preventDefault();
    if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return }
    if(!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('profile_id', profileId);
    await axios.post('http://localhost:4000/documents', fd, { headers: {'Content-Type':'multipart/form-data'} }).catch(()=>null)
    alert('uploaded')
  }
  return (
    <section style={{marginTop:24}}>
      <h3>Upload document</h3>
      <form onSubmit={send}>
        <input type="file" onChange={e=>setFile(e.target.files[0])} />
        <input placeholder="profile id (optional)" value={profileId} onChange={e=>setProfileId(e.target.value)} />
        <button type="submit">Upload</button>
      </form>
    </section>
  )
}

function Medicines(){
  const [profileId,setProfileId]=useState('')
  const [list,setList]=useState([])
  const [name,setName]=useState('')
  async function fetch(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } if(!profileId) return; const r=await axios.get('http://localhost:4000/medicines',{params:{profile_id:profileId}}).catch(()=>null); if(r) setList(r.data) }
  async function add(e){ e.preventDefault(); if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } await axios.post('http://localhost:4000/medicines',{profile_id:profileId,name}).catch(()=>null); setName(''); fetch() }
  return (
    <section style={{marginTop:24}}>
      <h3>Medicines</h3>
      <input placeholder="profile id" value={profileId} onChange={e=>setProfileId(e.target.value)} />
      <button onClick={fetch}>Load</button>
      <form onSubmit={add}>
        <input placeholder="medicine name" value={name} onChange={e=>setName(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>{list.map(m=>(<li key={m.id}>{m.name} {m.dosage || ''}</li>))}</ul>
    </section>
  )
}

function Visits(){
  const [profileId,setProfileId]=useState('')
  const [list,setList]=useState([])
  const [date,setDate]=useState('')
  const [provider,setProvider]=useState('')
  async function fetch(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } if(!profileId) return; const r=await axios.get('http://localhost:4000/visits',{params:{profile_id:profileId}}).catch(()=>null); if(r) setList(r.data) }
  async function add(e){ e.preventDefault(); if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } await axios.post('http://localhost:4000/visits',{profile_id:profileId,date,provider}).catch(()=>null); setDate(''); setProvider(''); fetch() }
  return (
    <section style={{marginTop:24}}>
      <h3>Visits</h3>
      <input placeholder="profile id" value={profileId} onChange={e=>setProfileId(e.target.value)} />
      <button onClick={fetch}>Load</button>
      <form onSubmit={add}>
        <input placeholder="date (YYYY-MM-DD)" value={date} onChange={e=>setDate(e.target.value)} />
        <input placeholder="provider" value={provider} onChange={e=>setProvider(e.target.value)} />
        <button type="submit">Add Visit</button>
      </form>
      <ul>{list.map(v=>(<li key={v.id}>{v.date} — {v.provider} — {v.reason || ''}</li>))}</ul>
    </section>
  )
}

function Timeline(){
  const [profileId,setProfileId]=useState('')
  const [items,setItems]=useState([])
  async function fetch(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } if(!profileId) return; const r=await axios.get('http://localhost:4000/timeline',{params:{profile_id:profileId}}).catch(()=>null); if(r) setItems(r.data) }
  return (
    <section style={{marginTop:24}}>
      <h3>Timeline</h3>
      <input placeholder="profile id" value={profileId} onChange={e=>setProfileId(e.target.value)} />
      <button onClick={fetch}>Load</button>
      <ul>
        {items.map(it=>(<li key={it.id}>{it.date} — {it.kind} — {it.title}</li>))}
      </ul>
    </section>
  )
}

function SearchAssistant(){
  const [profileId,setProfileId]=useState('')
  const [query,setQuery]=useState('')
  const [results,setResults]=useState([])
  const [assistant,setAssistant]=useState(null)
  async function runSearch(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } if(!profileId) return; const r=await axios.post('http://localhost:4000/search/semantic',{profile_id:profileId,query,top_k:10}).catch(()=>null); if(r) setResults(r.data.results) }
  async function runAssistant(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } if(!profileId) return; const r=await axios.post('http://localhost:4000/assistant/query',{profile_id:profileId,query}).catch(()=>null); if(r) setAssistant(r.data) }
  return (
    <section style={{marginTop:24}}>
      <h3>Search & Assistant</h3>
      <input placeholder="profile id" value={profileId} onChange={e=>setProfileId(e.target.value)} />
      <input placeholder="query" value={query} onChange={e=>setQuery(e.target.value)} />
      <button onClick={runSearch}>Search</button>
      <button onClick={runAssistant} style={{marginLeft:8}}>Ask Assistant</button>
      <div>
        <h4>Results</h4>
        <ul>{results.map(r=>(<li key={r.id}>{r.snippet} — {r.score}</li>))}</ul>
      </div>
      <div>
        <h4>Assistant</h4>
        {assistant && (
          <div>
            <p><strong>Summary:</strong> {assistant.summary}</p>
            <p><strong>Disclaimer:</strong> {assistant.disclaimer}</p>
            <ul>{assistant.sources.map(s=>(<li key={s.id}>{s.filename}</li>))}</ul>
          </div>
        )}
      </div>
    </section>
  )
}

function DocumentsList(){
  const [docs,setDocs]=useState([])
  useEffect(()=>{ if(!getToken()){ return } axios.get('http://localhost:4000/documents').then(r=>setDocs(r.data)).catch(()=>{}) },[])
  return (
    <section style={{marginTop:24}}>
      <h3>Documents</h3>
      <ul>
        {docs.map(d=> (
          <li key={d.id}>{d.filename} — {d.created_at} — <a href={`http://localhost:4000/documents/${d.id}/download`} target="_blank" rel="noreferrer">download</a> — <a href={`#`} onClick={async()=>{ await axios.post(`http://localhost:4000/documents/${d.id}/ingest`).catch(()=>null); alert('ingest started') }}>ingest OCR</a> — <a href={`#`} onClick={async()=>{ const r=await axios.get(`http://localhost:4000/documents/${d.id}/ocr`).catch(()=>null); if(r) alert(r.data.ocr_text) }}>view OCR</a></li>
        ))}
      </ul>
    </section>
  )
}

function AgentUI(){
  const [profileId,setProfileId]=useState('')
  const [action,setAction]=useState('check_followups')
  const [events,setEvents]=useState([])
  async function run(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } const r=await axios.post('http://localhost:4000/agent/run',{profile_id:profileId,action}).catch(()=>null); if(r) alert('agent queued') }
  async function load(){ if(!getToken()){ alert('Please sign in'); removeToken(); window.location.reload(); return } const r=await axios.get('http://localhost:4000/webhooks').catch(()=>null); if(r) setEvents(r.data) }
  return (
    <section style={{marginTop:24}}>
      <h3>Agent</h3>
      <input placeholder="profile id" value={profileId} onChange={e=>setProfileId(e.target.value)} />
      <select value={action} onChange={e=>setAction(e.target.value)}>
        <option value="check_followups">Check follow-ups</option>
        <option value="remind_medications">Remind medications</option>
      </select>
      <button onClick={run}>Run Agent</button>
      <button onClick={load} style={{marginLeft:8}}>Load Events</button>
      <ul>{events.map(ev=>(<li key={ev.id}>{ev.event} — {ev.created_at} — {ev.payload}</li>))}</ul>
    </section>
  )
}
