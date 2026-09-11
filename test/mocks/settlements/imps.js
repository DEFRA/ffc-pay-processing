const { getSourceSystems } = require('ffc-pay-schemes')
const settlement = require('./settlement')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')

const { IMPS } = getSourceSystems()

module.exports = {
  ...settlement,
  sourceSystem: IMPS,
  transactionNumber: `${AGREEMENT_NUMBER}-001-001`
}
