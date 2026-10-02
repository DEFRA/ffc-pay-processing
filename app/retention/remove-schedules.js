const db = require('../database')

const removeSchedules = async (paymentRequestIds, transaction) => {
  await db.schedule(transaction ?? undefined)
    .whereIn('paymentRequestId', paymentRequestIds)
    .del()
}

module.exports = {
  removeSchedules
}
