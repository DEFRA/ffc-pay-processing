const db = require('../database')

const getSettlementPaymentRequest = async (filter) => {
  return (await db.completedPaymentRequest()
    .where({ ...filter })
    .first()) ?? null
}

module.exports = {
  getSettlementPaymentRequest
}
