const calculateLineDeltas = (invoiceLines) => {
  return [...invoiceLines.reduce((x, y) => {
    // group by line types, so create key representing the combination
    // exclude account code as past requests vary based on ledger
    const key = `${y.schemeCode}-${y.fundCode}-${y.description}`

    // if key doesn't exist then first instance so create new group
    const item = x.get(key) || Object.assign({}, { schemeCode: y.schemeCode, fundCode: y.fundCode, description: y.description, value: 0 })
    item.value += Number(y.value)

    return x.set(key, item)
  }, new Map()).values()]
}

module.exports = calculateLineDeltas
