const sanitizeInvoiceLine = (invoiceLine) => {
  if (invoiceLine?.description) {
    invoiceLine.description = invoiceLine.description.replaceAll(/€|â‚¬/g, 'EUR')
  }
}

module.exports = {
  sanitizeInvoiceLine
}
