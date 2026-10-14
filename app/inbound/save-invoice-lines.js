const db = require('../database')
const TABLES = require('../constants/tables')
const { pickColumns } = require('../constants/columns')
const { sanitizeInvoiceLine } = require('../helpers/sanitize-invoice-line')

const saveInvoiceLines = async (invoiceLines, paymentRequestId, transaction) => {
  for (const invoiceLine of invoiceLines) {
    delete invoiceLine.invoiceLineId
    sanitizeInvoiceLine(invoiceLine)
    await db.invoiceLine(transaction ?? undefined).insert(pickColumns({ ...invoiceLine, paymentRequestId }, TABLES.invoiceLine))
  }
}

module.exports = {
  saveInvoiceLines
}
