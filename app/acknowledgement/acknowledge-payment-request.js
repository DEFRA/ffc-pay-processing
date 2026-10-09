const db = require('../database')

const acknowledgePaymentRequest = async (invoiceNumber, acknowledged) => {
  await db.completedPaymentRequest().where({ invoiceNumber }).update({ acknowledged })
}

module.exports = {
  acknowledgePaymentRequest
}
