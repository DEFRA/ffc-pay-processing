const createSplitInvoiceNumber = require('./create-split-invoice-number')
const { AP } = require('../../ledgers')
const ensureValueConsistency = require('./ensure-value-consistency')
const { v4: uuidv4 } = require('uuid')

const splitToLedger = (paymentRequest, targetValue, ledger) => {
  console.log(`Performing ledger split for ${paymentRequest.invoiceNumber}`)
  const originalValue = paymentRequest.value
  const updatedValue = ledger === AP ? originalValue + targetValue : originalValue - targetValue

  paymentRequest.originalInvoiceNumber = paymentRequest.invoiceNumber
  paymentRequest.invoiceNumber = createSplitInvoiceNumber(paymentRequest.invoiceNumber, 'A', paymentRequest.schemeId)

  const splitPaymentRequest = copyPaymentRequest(paymentRequest, ledger)

  const splitApportionmentPercent = Math.abs(targetValue) / Math.abs(paymentRequest.value)
  const apportionmentPercent = 1 - splitApportionmentPercent

  calculateInvoiceLines(paymentRequest.invoiceLines, apportionmentPercent)
  calculateInvoiceLines(splitPaymentRequest.invoiceLines, splitApportionmentPercent)

  paymentRequest.value = updatedValue
  splitPaymentRequest.value = originalValue - updatedValue

  ensureValueConsistency(paymentRequest)
  ensureValueConsistency(splitPaymentRequest)

  return [paymentRequest, splitPaymentRequest]
}

const copyPaymentRequest = (paymentRequest, ledger) => {
  const copiedPaymentRequest = JSON.parse(JSON.stringify(paymentRequest))
  return {
    ...copiedPaymentRequest,
    ledger,
    invoiceNumber: createSplitInvoiceNumber(paymentRequest.originalInvoiceNumber, 'B', paymentRequest.schemeId),
    referenceId: uuidv4()
  }
}

const calculateInvoiceLines = (invoiceLines, apportionmentPercent) => {
  invoiceLines.map(x => {
    x.value = Math.trunc(x.value * apportionmentPercent)
    return x
  })
}

module.exports = splitToLedger
