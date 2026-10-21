const db = require('../database')

const removeOutbox = async (completedPaymentRequestIds, transaction) => {
  await db.outbox(transaction ?? undefined)
    .whereIn('completedPaymentRequestId', completedPaymentRequestIds)
    .del()
}

module.exports = {
  removeOutbox
}
