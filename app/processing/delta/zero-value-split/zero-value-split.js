const { AP } = require('../../../constants/ledgers')
const { calculateOverallDelta } = require('../calculate-overall-delta')
const { createSplitPaymentRequest } = require('./create-split-payment-request')

const zeroValueSplit = paymentRequest => {
  console.log(`Performing zero value split for ${paymentRequest.invoiceNumber}`)

  const positiveLedger = AP
  const negativeLedger = AP

  const positivePaymentRequest = createSplitPaymentRequest(
    paymentRequest,
    positiveLedger,
    'A'
  )
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
