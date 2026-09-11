const { getSchemeIds } = require('ffc-pay-schemes')
const paymentRequest = require('./payment-request')

const { FPTT } = getSchemeIds()

module.exports = {
  ...paymentRequest,
  schemeId: FPTT
}
