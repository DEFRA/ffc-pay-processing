const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { CS } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: CS
}
