const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { WMP } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: WMP
}
