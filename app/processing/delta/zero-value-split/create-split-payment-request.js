const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { randomUUID } = require('node:crypto')

const createSplitPaymentRequest = (paymentRequest, ledger, splitId) => {
  return {
    ...paymentRequest,
    ledger,
    originalInvoiceNumber: paymentRequest.invoiceNumber,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.invoiceNumber, splitId, paymentRequest.schemeId),
    invoiceLines: [],
    referenceId: randomUUID()
  }
}

module.exports = {
  createSplitPaymentRequest
}
