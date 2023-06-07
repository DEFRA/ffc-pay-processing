const { enrichCSLine } = require('./enrich-cs-line')

const calculateCSLineDeltas = (invoiceLines, defaultAgreementNumber) => {
  const invoiceLinesWithFundingRates = enrichCSLine(invoiceLines)
  return [...invoiceLinesWithFundingRates.reduce((x, y) => {
    // group by line types, so create key representing the combination
    // exclude account code as past requests vary based on ledger
    const key = `${y.schemeCode}-${y.fundCode}-${y.marketingYear}-${y.agreementNumber ?? defaultAgreementNumber}-${y.convergence ?? false}-${y.deliveryBody}-${y.stateAid ?? false}-${y.description}`

    // if key doesn't exist then first instance so create new group
    const item = x.get(key) || Object.assign({}, {
      schemeCode: y.schemeCode,
      fundCode: y.fundCode,
      marketingYear: y.marketingYear,
      agreementNumber: y.agreementNumber ?? defaultAgreementNumber,
      convergence: y.convergence ?? false,
      deliveryBody: y.deliveryBody,
      stateAid: y.stateAid ?? false,
      description: y.description,
      value: 0
    })
    item.value += Number(y.value)

    return x.set(key, item)
  }, new Map()).values()]
}

module.exports = {
  calculateCSLineDeltas
}
