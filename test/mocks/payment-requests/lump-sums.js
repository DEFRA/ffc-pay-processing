const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { LUMP_SUMS } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: LUMP_SUMS
}
