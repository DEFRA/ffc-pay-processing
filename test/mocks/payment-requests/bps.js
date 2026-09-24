const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { BPS } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: BPS
}
