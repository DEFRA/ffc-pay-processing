const { sendAckInvalidBankDetailsErrorEvent } = require('./send-ack-invalid-bank-details-error-event')
const { sendProcessingAckErrorEvent } = require('./send-ack-error-event')
const { BANK_ACCOUNT_ANOMALY } = require('../constants/hold-categories-names')

const sendAcknowledgementErrorEvent = async (holdCategoryName, acknowledgement, paymentRequest) => {
  if (holdCategoryName === BANK_ACCOUNT_ANOMALY) {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
  } else {
    await sendProcessingAckErrorEvent(acknowledgement)
  }
}

module.exports = {
  sendAcknowledgementErrorEvent
}
