const db = require('../database')

const findCompletedPaymentRequests = async (paymentRequestIds, transaction) => {
  return db.completedPaymentRequest(transaction ?? undefined)
    .select('completedPaymentRequestId')
    .whereIn('paymentRequestId', paymentRequestIds)
}

module.exports = {
  findCompletedPaymentRequests
}
