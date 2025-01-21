const { AP, AR } = require('../../../constants/ledgers')
const { calculateOverallDelta } = require('../calculate-overall-delta')
const { createSplitPaymentRequest } = require('./create-split-payment-request')

const zeroValueSplit = (paymentRequest, isFirstClaim) => {
  console.log(`Performing zero value split for ${paymentRequest.invoiceNumber}`)
  const positivePaymentRequest = createSplitPaymentRequest(
    paymentRequest,
    AP,
    'A'
  )
  const negativeLedger = isFirstClaim ? AR : AP
  const negativePaymentRequest = createSplitPaymentRequest(
    paymentRequest,
    negativeLedger,
    'B'
  )

  paymentRequest.invoiceLines.forEach(invoiceLine => {
    if (invoiceLine.value > 0) {
      positivePaymentRequest.invoiceLines.push(invoiceLine)
    } else {
      negativePaymentRequest.invoiceLines.push(invoiceLine)
    }
  })

  negativePaymentRequest.value = calculateOverallDelta(
    negativePaymentRequest.invoiceLines
  )
  positivePaymentRequest.value = calculateOverallDelta(
    positivePaymentRequest.invoiceLines
  )

  return [positivePaymentRequest, negativePaymentRequest]
}

module.exports = {
  zeroValueSplit
}
