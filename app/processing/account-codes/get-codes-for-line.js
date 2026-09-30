const { getSchemeIds } = require('ffc-pay-schemes')
const { isCapital } = require('../is-capital')

const { CS } = getSchemeIds()

const getCodesForLine = (schemeId, lineCode, invoiceLine, accountCodeMap) => {
  if (schemeId === CS) {
    if (invoiceLine.stateAid) {
      return accountCodeMap.find(x => x.lineCode === lineCode && x.stateAid)
    }
    return accountCodeMap.find(x => x.lineCode === lineCode && !x.stateAid && (isCapital(invoiceLine.schemeCode) ? x.capital : x.revenue))
  }
  return accountCodeMap.find(x => x.lineCode === lineCode)
}

module.exports = {
  getCodesForLine
}
