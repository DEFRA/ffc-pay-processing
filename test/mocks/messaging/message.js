const paymentRequest = require('../payment-requests/payment-request')

module.exports = {
  body: {
    ...paymentRequest,
    paymentRequest
  }
}
