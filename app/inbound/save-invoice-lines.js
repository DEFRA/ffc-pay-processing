const db = require('../database')
const { sanitizeInvoiceLine } = require('../helpers/sanitize-invoice-line')

const saveInvoiceLines = async (invoiceLines, paymentRequestId, transaction) => {
  for (const invoiceLine of invoiceLines) {
    delete invoiceLine.invoiceLineId
    sanitizeInvoiceLine(invoiceLine)
    await db.invoiceLine(transaction ?? undefined).insert({
      paymentRequestId,
      schemeCode: invoiceLine.schemeCode,
      accountCode: invoiceLine.accountCode,
      fundCode: invoiceLine.fundCode,
      agreementNumber: invoiceLine.agreementNumber,
      description: invoiceLine.description,
      value: invoiceLine.value,
      convergence: invoiceLine.convergence,
      deliveryBody: invoiceLine.deliveryBody,
      marketingYear: invoiceLine.marketingYear,
      stateAid: invoiceLine.stateAid,
      invalid: invoiceLine.invalid
    })
  }
}

module.exports = {
  saveInvoiceLines
}
