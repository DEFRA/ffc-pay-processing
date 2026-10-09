const { EventPublisher } = require('ffc-pay-event-publisher')
const { messageConfig } = require('../config')
const { SOURCE } = require('../constants/source')
const { DUPLICATE_PAYMENT_WARNING } = require('../constants/events')

const MESSAGE = 'Duplicate payment request received for invoice number:'

const sendDuplicatePaymentEvent = async (paymentRequest, referenceId) => {
  const event = {
    source: SOURCE,
    type: DUPLICATE_PAYMENT_WARNING,
    subject: paymentRequest.invoiceNumber,
    data: {
      ...paymentRequest,
      message: MESSAGE,
      referenceId
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendDuplicatePaymentEvent
}
