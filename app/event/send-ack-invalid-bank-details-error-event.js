const { processingConfig, messageConfig } = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { SOURCE } = require('../constants/source')

const sendAckInvalidBankDetailsErrorEvent = async (paymentRequest) => {
  if (processingConfig.useV2Events) {
    await sendV2AckInvalidBankDetailsErrorEvent(paymentRequest)
  }
}

const sendV2AckInvalidBankDetailsErrorEvent = async (paymentRequest) => {
  const { frn, sourceSystem, contractNumber, agreementNumber, batch, claimDate, value, sbi, invoiceNumber, schemeId } = paymentRequest
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
      sbi,
      invoiceNumber,
      schemeId
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendAckInvalidBankDetailsErrorEvent
}
