const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { AP } = require('../../../constants/ledgers')
const { ensureValueConsistency } = require('./ensure-value-consistency')
const { calculateInvoiceLineValues } = require('./calculate-invoice-line-values')
const { createLedgerSplitPaymentRequest } = require('./create-ledger-split-payment-request')

const splitToLedger = (paymentRequest, targetValue, ledger) => {
  console.log(`Performing ledger split for ${paymentRequest.invoiceNumber}`)
  const originalValue = paymentRequest.value
  const updatedValue = ledger === AP ? originalValue + targetValue : originalValue - targetValue

  paymentRequest.originalInvoiceNumber = paymentRequest.invoiceNumber
  paymentRequest.invoiceNumber = createSplitInvoiceNumber(paymentRequest.invoiceNumber, 'A', paymentRequest.schemeId)

  const splitPaymentRequest = createLedgerSplitPaymentRequest(paymentRequest, ledger)

  const splitApportionmentPercent = Math.abs(targetValue) / Math.abs(paymentRequest.value)
  const apportionmentPercent = 1 - splitApportionmentPercent

  calculateInvoiceLineValues(paymentRequest.invoiceLines, apportionmentPercent)
  calculateInvoiceLineValues(splitPaymentRequest.invoiceLines, splitApportionmentPercent)

  paymentRequest.value = updatedValue
  splitPaymentRequest.value = originalValue - updatedValue

  ensureValueConsistency(paymentRequest)
  ensureValueConsistency(splitPaymentRequest)

  return [paymentRequest, splitPaymentRequest]
}

module.exports = {
  splitToLedger
}
