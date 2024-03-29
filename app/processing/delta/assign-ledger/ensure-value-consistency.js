const { getInvoiceLineTotal } = require('./get-invoice-line-total')

const ensureValueConsistency = (paymentRequest) => {
  // ensure no value gained or lost. if variation between total and lines apply difference to first gross line
  const invoiceLineTotal = getInvoiceLineTotal(paymentRequest)
  const variation = paymentRequest.value - invoiceLineTotal
  if (variation !== 0) {
    const firstGrossLineIndex = paymentRequest.invoiceLines.findIndex(x => x.description.startsWith('G00'))
    if (firstGrossLineIndex > 0) {
      paymentRequest.invoiceLines[firstGrossLineIndex].value += variation
    } else {
      paymentRequest.invoiceLines[0].value += variation
    }
  }
}

module.exports = {
  ensureValueConsistency
}
