const db = require('../database')

const invalidateInvoiceLines = async (paymentRequestId, transaction) => {
  await db.invoiceLine(transaction ?? undefined)
    .where({ paymentRequestId })
    .update({ invalid: true })
}

module.exports = {
  invalidateInvoiceLines
}
