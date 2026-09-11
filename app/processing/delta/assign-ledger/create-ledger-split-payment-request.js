const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { randomUUID } = require('node:crypto')

const createLedgerSplitPaymentRequest = (paymentRequest, ledger) => {
  const copiedPaymentRequest = structuredClone(paymentRequest)
  return {
    ...copiedPaymentRequest,
    ledger,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.originalInvoiceNumber, 'B', paymentRequest.schemeId),
    referenceId: randomUUID()
  }
}

module.exports = {
  createLedgerSplitPaymentRequest
}
