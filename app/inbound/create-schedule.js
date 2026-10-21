const db = require('../database')

const createSchedule = async (paymentRequestId, transaction) => {
  await db.schedule(transaction ?? undefined).insert({
    paymentRequestId,
    planned: new Date()
  })
}

module.exports = {
  createSchedule
}
