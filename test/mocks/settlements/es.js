const { getSourceSystems } = require('ffc-pay-schemes')
const settlement = require('./settlement')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')

const { ES } = getSourceSystems()

module.exports = {
  ...settlement,
  sourceSystem: ES,
  transactionNumber: AGREEMENT_NUMBER
}
