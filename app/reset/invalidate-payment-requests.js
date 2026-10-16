const db = require('../database')

const invalidatePaymentRequests = async (paymentRequestId, transaction) => {
  await db.completedPaymentRequest(transaction ?? undefined).where({ paymentRequestId }).update({ invalid: true })
}

module.exports = {
  invalidatePaymentRequests
}
