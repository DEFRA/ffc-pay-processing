const db = require('../database')

const confirmPaymentRequestNumber = async (paymentRequest) => {
  if (paymentRequest.paymentRequestNumber > 1) {
    return paymentRequest.paymentRequestNumber
  }
  const completedPaymentRequest = await db.completedPaymentRequest()
    .select('paymentRequestNumber')
    .where({
      schemeId: paymentRequest.schemeId,
      frn: paymentRequest.frn,
      marketingYear: paymentRequest.marketingYear,
      invalid: false
    })
    .orderBy('paymentRequestNumber', 'desc')
    .first()
  if (completedPaymentRequest) {
    return completedPaymentRequest.paymentRequestNumber + 1
  }
  return paymentRequest.paymentRequestNumber
}

module.exports = {
  confirmPaymentRequestNumber
}
