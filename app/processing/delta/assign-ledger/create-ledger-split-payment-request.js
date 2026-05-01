const { randomUUID } = require('node:crypto')
const { createSplitInvoiceNumber } = require('../invoice-number')

const createLedgerSplitPaymentRequest = (paymentRequest, ledger) => {
  const copiedPaymentRequest = JSON.parse(JSON.stringify(paymentRequest))
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
