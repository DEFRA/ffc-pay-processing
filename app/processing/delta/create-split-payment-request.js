const { v4: uuidv4 } = require('uuid')
const { createSplitInvoiceNumber } = require('./create-split-invoice-number')

const createSplitPaymentRequest = (paymentRequest, ledger, splitId) => {
  return {
    ...paymentRequest,
    ledger,
    originalInvoiceNumber: paymentRequest.invoiceNumber,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.invoiceNumber, splitId, paymentRequest.schemeId),
    invoiceLines: [],
    referenceId: uuidv4()
  }
}

module.exports = {
  createSplitPaymentRequest
}
