const db = require('../data')
const { sanitizeInvoiceLine } = require('../helpers/sanitize-invoice-line')

const saveInvoiceLines = async (invoiceLines, paymentRequestId, transaction) => {
  for (const invoiceLine of invoiceLines) {
    delete invoiceLine.invoiceLineId
    sanitizeInvoiceLine(invoiceLine)
    await db.invoiceLine.create({ ...invoiceLine, paymentRequestId }, { transaction })
  }
}

module.exports = {
  saveInvoiceLines
}
