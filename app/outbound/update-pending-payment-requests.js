const db = require('../database')

const updatePendingPaymentRequests = async (paymentRequests, submitted, transaction) => {
  const paymentRequestIds = paymentRequests.map(x => x.completedPaymentRequestId)
  await db.completedPaymentRequest(transaction ?? undefined).whereIn('completedPaymentRequestId', paymentRequestIds).update({ submitted })
  await db.outbox(transaction ?? undefined).whereIn('completedPaymentRequestId', paymentRequestIds).update({ submitted })
}

module.exports = {
  updatePendingPaymentRequests
}
