const { randomUUID } = require('node:crypto')
const db = require('../database')

const resetReferenceId = async (paymentRequestId, transaction) => {
  await db.paymentRequest(transaction ?? undefined).where({ paymentRequestId }).update({ referenceId: randomUUID() })
}

module.exports = {
  resetReferenceId
}
