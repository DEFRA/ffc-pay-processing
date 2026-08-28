const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { DUPLICATE_PAYMENT } = require('../constants/events')

const sendDuplicatePaymentEvent = async (paymentRequest, referenceId) => {
  const { invoiceNumber, sourceSystem, schemeId } = paymentRequest
  const event = {
    source: SOURCE,
    type: DUPLICATE_PAYMENT,
    subject: invoiceNumber,
    data: {
      message: 'Duplicate payment request received for invoice number:',
      invoiceNumber,
      referenceId,
      sourceSystem,
      schemeId
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendDuplicatePaymentEvent
}
