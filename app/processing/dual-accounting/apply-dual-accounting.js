const { getSchemeIds } = require('ffc-pay-schemes')
const { applyBPSDualAccounting } = require('./bps')
const { applyCSDualAccounting } = require('./cs')

const { BPS, CS } = getSchemeIds()

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
