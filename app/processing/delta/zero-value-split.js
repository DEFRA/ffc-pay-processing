const createSplitInvoiceNumber = require('./create-split-invoice-number')
const { AP } = require('../../ledgers')
const calculateOverallDelta = require('./calculate-overall-delta')
const { v4: uuidv4 } = require('uuid')

const zeroValueSplit = (paymentRequest) => {
  console.log(`Performing zero value split for ${paymentRequest.invoiceNumber}`)
  const positivePaymentRequest = copyPaymentRequest(paymentRequest, AP, 'A')
  const negativePaymentRequest = copyPaymentRequest(paymentRequest, AP, 'B')

  paymentRequest.invoiceLines.forEach(invoiceLine => {
    if (invoiceLine.value > 0) {
      positivePaymentRequest.invoiceLines.push(invoiceLine)
    } else {
      negativePaymentRequest.invoiceLines.push(invoiceLine)
    }
  })

  negativePaymentRequest.value = calculateOverallDelta(negativePaymentRequest.invoiceLines)
  positivePaymentRequest.value = calculateOverallDelta(positivePaymentRequest.invoiceLines)

  return [positivePaymentRequest, negativePaymentRequest]
}

const copyPaymentRequest = (paymentRequest, ledger, splitId) => {
  return {
    ...paymentRequest,
    ledger,
    originalInvoiceNumber: paymentRequest.invoiceNumber,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.invoiceNumber, splitId, paymentRequest.schemeId),
    invoiceLines: [],
    referenceId: uuidv4()
  }
}

module.exports = zeroValueSplit
