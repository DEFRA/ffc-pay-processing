const { randomUUID } = require('node:crypto')
const { createSplitInvoiceNumber } = require('../invoice-number')

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
