const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI_PILOT } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: SFI_PILOT
}
