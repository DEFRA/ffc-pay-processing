const { createSplitInvoiceNumber } = require('../../invoice-number')
const calculateOverallDelta = require('./calculate-overall-delta')

const zeroValueSplit = (paymentRequest) => {
  const apPaymentRequest = copyPaymentRequest(paymentRequest, 'AP', 'A')
  const arPaymentRequest = copyPaymentRequest(paymentRequest, 'AR', 'B')

  paymentRequest.invoiceLines.map(invoiceLine => {
    if (invoiceLine.value > 0) {
      apPaymentRequest.invoiceLines.push(invoiceLine)
    } else {
      arPaymentRequest.invoiceLines.push(invoiceLine)
    }
  })

  arPaymentRequest.value = calculateOverallDelta(arPaymentRequest.invoiceLines)
  apPaymentRequest.value = calculateOverallDelta(apPaymentRequest.invoiceLines)

  return [apPaymentRequest, arPaymentRequest]
}

const copyPaymentRequest = (paymentRequest, ledger, splitId) => {
  const copiedPaymentRequest = JSON.parse(JSON.stringify(paymentRequest))
  return {
    ...copiedPaymentRequest,
    ledger,
    originalInvoiceNumber: paymentRequest.invoiceNumber,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.invoiceNumber, splitId),
    invoiceLines: []
  }
}

module.exports = zeroValueSplit
