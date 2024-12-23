const invoicePatterns = require('../constants/invoice-patterns')

const verifyInvoiceNumber = (invoiceNumber) => {
  for (const [pattern] of Object.entries(invoicePatterns)) {
    const matches = invoiceNumber.match(pattern)
    if (matches) {
      return false
    }
  }
  return true
}

module.exports = {
  verifyInvoiceNumber
}
