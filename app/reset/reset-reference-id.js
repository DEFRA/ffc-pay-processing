const { randomUUID } = require('node:crypto')
const db = require('../data')

const resetReferenceId = async (paymentRequestId, transaction) => {
  await db.paymentRequest.update({ referenceId: randomUUID() }, { where: { paymentRequestId }, transaction })
}

module.exports = {
  resetReferenceId
}
