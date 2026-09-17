const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { DUPLICATE_PAYMENT_WARNING, DUPLICATE_PAYMENT } = require('../constants/events')

const MESSAGE = 'Duplicate payment request received for invoice number:'

const sendDuplicatePaymentEvent = async (paymentRequest, referenceId) => {
  const { invoiceNumber, sourceSystem, schemeId } = paymentRequest
  const warningEvent = {
    source: SOURCE,
    type: DUPLICATE_PAYMENT_WARNING,
    subject: invoiceNumber,
    data: {
      message: MESSAGE,
      invoiceNumber,
      referenceId,
      sourceSystem,
      schemeId
    }
  }
  const paymentEvent = {
    source: SOURCE,
    type: DUPLICATE_PAYMENT,
    subject: invoiceNumber,
    data: {
      ...paymentRequest,
      message: MESSAGE,
      referenceId
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvents([warningEvent, paymentEvent])
}

module.exports = {
  sendDuplicatePaymentEvent
}
