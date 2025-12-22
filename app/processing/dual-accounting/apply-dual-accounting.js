const { BPS, CS } = require('../../constants/schemes')
const { applyBPSDualAccounting } = require('./bps')
const { applyCSDualAccounting } = require('./cs')

const applyDualAccounting = (paymentRequest, previousPaymentRequests) => {
  if (paymentRequest.schemeId === BPS) {
    return applyBPSDualAccounting(paymentRequest, previousPaymentRequests)
  } else if (paymentRequest.schemeId === CS) {
    return applyCSDualAccounting(paymentRequest, previousPaymentRequests)
  }
  return paymentRequest
}

module.exports = {
  applyDualAccounting
}
