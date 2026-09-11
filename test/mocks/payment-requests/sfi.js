const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: SFI
}
