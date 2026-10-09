const db = require('../database')

const removeInvoiceLines = async (paymentRequestIds, transaction) => {
  await db.invoiceLine(transaction ?? undefined)
    .whereIn('paymentRequestId', paymentRequestIds)
    .del()
}

module.exports = {
  removeInvoiceLines
}
