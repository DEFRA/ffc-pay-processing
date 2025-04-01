const { FRN } = require('../values/frn')
const { TIMESTAMP } = require('../values/date')
const { MARKETING_YEAR } = require('../values/marketing-year')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')
const { CONTRACT_NUMBER } = require('../values/contract-number')

module.exports = {
  autoHoldId: 1,
  autoHoldCategoryId: 1,
  frn: FRN,
  marketingYear: MARKETING_YEAR,
  agreementNumber: AGREEMENT_NUMBER,
  contractNumber: CONTRACT_NUMBER,
  added: TIMESTAMP
}
