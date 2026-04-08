const sanitizeInvoiceLine = (invoiceLine) => {
  if (invoiceLine && invoiceLine.description) {
    invoiceLine.description = invoiceLine.description.replace(/€|â‚¬/g, 'EUR')
  }
}

module.exports = {
  sanitizeInvoiceLine
}
