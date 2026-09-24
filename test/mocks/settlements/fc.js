const { getSourceSystems } = require('ffc-pay-schemes')
const settlement = require('./settlement')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')
const { CONTRACT_NUMBER } = require('../values/contract-number')

const { FC } = getSourceSystems()

module.exports = {
  ...settlement,
  sourceSystem: FC,
  agreementNumber: AGREEMENT_NUMBER,
  claimNumber: CONTRACT_NUMBER
}
