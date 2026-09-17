const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { DELINKED } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: DELINKED
}
