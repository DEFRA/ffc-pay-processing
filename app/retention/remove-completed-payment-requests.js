const db = require('../database')

const removeCompletedPaymentRequests = async (completedPaymentRequestIds, transaction) => {
  await db.completedPaymentRequest(transaction ?? undefined)
    .whereIn('completedPaymentRequestId', completedPaymentRequestIds)
    .del()
}

module.exports = {
  removeCompletedPaymentRequests
}
