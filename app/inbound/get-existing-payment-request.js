const db = require('../database')

const getExistingPaymentRequest = async (invoiceNumber, transaction) => {
  return (await db.paymentRequest(transaction ?? undefined)
    .select('paymentRequestId', 'invoiceNumber', 'referenceId')
    .where({ invoiceNumber })
    .first()) ?? null
}

module.exports = {
  getExistingPaymentRequest
}
