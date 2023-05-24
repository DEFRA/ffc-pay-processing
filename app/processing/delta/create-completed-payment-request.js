const { getDefaultLedger } = require('./get-default-ledger')

const createCompletedPaymentRequest = (paymentRequest, overallDelta, lineDeltas) => {
  return {
    ...paymentRequest,
    value: overallDelta,
    settledValue: 0,
    ledger: getDefaultLedger(overallDelta),
    invoiceLines: lineDeltas.filter(x => x.value !== 0),
    netValue: paymentRequest.value
  }
}

module.exports = {
  createCompletedPaymentRequest
}
