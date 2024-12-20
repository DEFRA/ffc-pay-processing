const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')
const { PAYMENT_INVALID_BANK } = require('../constants/events')

const sendAckInvalidBankDetailsErrorEvent = async (paymentRequest) => {
  if (processingConfig.useV2Events) {
    await sendV2AckInvalidBankDetailsErrorEvent(paymentRequest)
  }
}

const sendV2AckInvalidBankDetailsErrorEvent = async (paymentRequest) => {
  const { frn, sourceSystem, contractNumber, agreementNumber, batch, claimDate, value, sbi } = paymentRequest
  const event = {
    source: SOURCE,
    type: PAYMENT_INVALID_BANK,
    data: {
      message: 'No valid bank details held',
      frn,
      sourceSystem,
      contractNumber,
      agreementNumber,
      batch,
      claimDate,
      value,
      sbi
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendAckInvalidBankDetailsErrorEvent
}
