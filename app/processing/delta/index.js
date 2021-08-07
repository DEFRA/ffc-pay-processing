const allocateToLedgers = require('./allocate-to-ledgers')
const calculateLineDeltas = require('./calculate-line-deltas')
const calculateOverallDelta = require('./calculate-overall-delta')
const getDefaultLedger = require('./get-default-ledger')
const getInvoiceLines = require('./get-invoice-lines')
const getUnsettled = require('./get-unsettled')
const zeroValueSplit = require('./zero-value-split')

const calculateDelta = (paymentRequest, previousPaymentRequests) => {
  const invoiceLines = getInvoiceLines(paymentRequest, previousPaymentRequests)

  const lineDeltas = calculateLineDeltas(invoiceLines)
  const overallDelta = calculateOverallDelta(invoiceLines)
  const updatedPaymentRequest = copyPaymentRequest(paymentRequest, overallDelta, lineDeltas)

  // if overall delta 0 but lines have non-zero lines,
  // need to move all positive lines to AP and all negative to AR.
  if (overallDelta === 0 && invoiceLines.length) {
    return zeroValueSplit(updatedPaymentRequest)
  }

  // if either ledger has unsettled requests
  // need to reallocate/split to cover.
  const unsettled = getUnsettled(previousPaymentRequests)
  if (unsettled.hasUnsettled) {
    return allocateToLedgers(updatedPaymentRequest, unsettled)
  }

  return [updatedPaymentRequest]
}

const copyPaymentRequest = (paymentRequest, overallDelta, lineDeltas) => {
  return {
    ...paymentRequest,
    value: overallDelta,
    ledger: getDefaultLedger(overallDelta),
    invoiceLines: lineDeltas.filter(x => x.value !== 0)
  }
}

module.exports = calculateDelta
