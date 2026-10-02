const db = require('../database')

const getExistingSchedule = async (paymentRequestId, transaction) => {
  return (await db.schedule(transaction ?? undefined)
    .where({ paymentRequestId, completed: null })
    .first()) ?? null
}

module.exports = {
  getExistingSchedule
}
