const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI23 } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: SFI23
}
