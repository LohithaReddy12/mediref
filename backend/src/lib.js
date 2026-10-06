function fakeEmbeddings(text){
  const sum = Array.from(text || '').reduce((s,c)=>s+c.charCodeAt(0),0);
  return [sum % 1000];
}

module.exports = { fakeEmbeddings }
