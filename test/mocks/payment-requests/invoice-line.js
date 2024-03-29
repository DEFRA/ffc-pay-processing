const { SCHEME_CODE } = require('../values/scheme-code')
const { ACCOUNT_CODE } = require('../values/account-code')
const { FUND_CODE } = require('../values/fund-code')
const { GROSS_DESCRIPTION } = require('../values/description')
const { DELIVERY_BODY_RPA } = require('../values/delivery-body')
const { AGREEMENT_NUMBER } = require('../values/agreement-number')
const { MARKETING_YEAR } = require('../values/marketing-year')

module.exports = {
  schemeCode: SCHEME_CODE,
  accountCode: ACCOUNT_CODE,
  fundCode: FUND_CODE,
  description: GROSS_DESCRIPTION,
  value: 100.00,
  deliveryBody: DELIVERY_BODY_RPA,
  agreementNumber: AGREEMENT_NUMBER,
  convergence: false,
  marketingYear: MARKETING_YEAR
}
