const db = require('../database')

const removeCompletedInvoiceLines = async (completedPaymentRequestIds, transaction) => {
  await db.completedInvoiceLine(transaction ?? undefined)
    .whereIn('completedPaymentRequestId', completedPaymentRequestIds)
    .del()
}

module.exports = {
  removeCompletedInvoiceLines
}
