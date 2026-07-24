const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { getPaymentRequestByInvoiceAndFrn } = require('../processing/get-payment-request-by-invoice-frn')
const { SOURCE } = require('../constants/source')
const { PAYMENT_ACKNOWLEDGED } = require('../constants/events')
const { sendReturnResponse } = require('../messaging/send-return-response')

const sendAckEvent = async (message) => {
  const paymentRequest = await getPaymentRequestByInvoiceAndFrn(message.invoiceNumber, message.frn)
  const event = {
    source: SOURCE,
    type: PAYMENT_ACKNOWLEDGED,
    data: paymentRequest
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
  await sendReturnResponse(paymentRequest, PAYMENT_ACKNOWLEDGED)
}

module.exports = {
  sendAckEvent
}
