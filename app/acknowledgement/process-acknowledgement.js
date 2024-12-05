const { acknowledgePaymentRequest } = require('./acknowledge-payment-request')
const { sendAckEvent } = require('../event')
const { getPaymentRequest } = require('./get-payment-request')
const { processInvalid } = require('./process-invalid')

const processAcknowledgement = async (acknowledgement) => {
  await acknowledgePaymentRequest(acknowledgement.invoiceNumber, acknowledgement.acknowledged)

  if (acknowledgement.success) {
    await sendAckEvent(acknowledgement)
  } else if (!acknowledgement.message?.toLowerCase().includes('duplicate')) {
    const { schemeId, paymentRequestId, frn, sourceSystem } = await getPaymentRequest(acknowledgement.invoiceNumber)
    await processInvalid(schemeId, paymentRequestId, frn, sourceSystem, acknowledgement)
  }
}

module.exports = {
  processAcknowledgement
}
