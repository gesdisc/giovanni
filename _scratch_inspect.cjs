const fs = require('fs')
const c = fs.readFileSync('node_modules/@nasa-terra/components/dist/chunks/chunk.OGB74DMG.js', 'utf8')

function findAll(needle) {
  let idx = -1
  const res = []
  while ((idx = c.indexOf(needle, idx + 1)) !== -1) res.push(idx)
  return res
}

for (const t of ['facets', 'observations', 'platformInstruments', 'categoryFilter', 'dataProductObservation', 'filterOptions', '"radio"']) {
  console.log(t, '=>', findAll(t))
}
