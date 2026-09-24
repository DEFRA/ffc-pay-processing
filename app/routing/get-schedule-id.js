const db = require('../database')

const getScheduleId = async (paymentRequestId) => {
  return (await db.schedule().where({ paymentRequestId, completed: null }).first()) ?? null
}

module.exports = {
  getScheduleId
}
