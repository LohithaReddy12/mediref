const { fakeEmbeddings } = require('../src/lib')

test('fakeEmbeddings returns deterministic vector', ()=>{
  const a = fakeEmbeddings('abc')
  const b = fakeEmbeddings('abc')
  expect(a).toEqual(b)
  expect(Array.isArray(a)).toBe(true)
})
