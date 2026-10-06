const request = require('supertest')
const fs = require('fs')
const path = require('path')

// ensure test DB isolated
const DATA_DIR = path.join(__dirname, '..', 'data_test')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

process.env.NODE_ENV = 'test'
process.env.DATA_DIR = DATA_DIR
process.env.JWT_SECRET = 'test-secret'

const app = require('../src/index')
const Database = require('better-sqlite3')

let server
beforeAll((done)=>{
  server = app.listen(0, done)
})
afterAll((done)=>{
  server.close(done)
})

test('register and login flow', async ()=>{
  const email = `test+${Date.now()}@example.com`
  const res = await request(app).post('/auth/register').send({ email, password: 'pass123' })
  expect(res.statusCode).toBe(201)
  const login = await request(app).post('/auth/login').send({ email, password: 'pass123' })
  expect(login.statusCode).toBe(200)
  expect(login.body.token).toBeTruthy()
})
