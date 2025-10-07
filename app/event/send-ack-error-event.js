const { messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { getPaymentRequestByInvoiceAndFrn } = require('../processing/get-payment-request-by-invoice-frn')
const { SOURCE } = require('../constants/source')
const { PAYMENT_DAX_REJECTED } = require('../constants/events')

const sendProcessingAckErrorEvent = async (acknowledgement) => {
  const paymentRequest = await getPaymentRequestByInvoiceAndFrn(acknowledgement.invoiceNumber, acknowledgement.frn)
  const event = {
    source: SOURCE,
    type: PAYMENT_DAX_REJECTED,
    data: {
      message: 'Payment request rejected by DAX',
      ...acknowledgement,
      ...paymentRequest
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendProcessingAckErrorEvent
}
