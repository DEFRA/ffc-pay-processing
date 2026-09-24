const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI26 } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: SFI26
}
