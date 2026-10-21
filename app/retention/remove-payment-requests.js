const db = require('../database')

const removePaymentRequests = async (paymentRequestIds, transaction) => {
  await db.paymentRequest(transaction ?? undefined)
    .whereIn('paymentRequestId', paymentRequestIds)
    .del()
}

module.exports = {
  removePaymentRequests
}
