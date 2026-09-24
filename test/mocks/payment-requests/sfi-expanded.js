const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { SFI_EXPANDED } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: SFI_EXPANDED
}
