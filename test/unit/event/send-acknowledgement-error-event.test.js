const mockSendAckInvalidBankDetailsErrorEvent = jest.fn()
const mockSendProcessingAckErrorEvent = jest.fn()

jest.mock('../../../app/event/send-ack-invalid-bank-details-error-event', () => {
  return {
    sendAckInvalidBankDetailsErrorEvent: mockSendAckInvalidBankDetailsErrorEvent
  }
})

jest.mock('../../../app/event/send-ack-error-event', () => {
  return {
    sendProcessingAckErrorEvent: mockSendProcessingAckErrorEvent
  }
})

const { BANK_ACCOUNT_ANOMALY } = require('../../../app/constants/hold-categories-names')
const { sendAcknowledgementErrorEvent } = require('../../../app/event/send-acknowledgement-error-event')

const acknowledgement = require('../../mocks/acknowledgement')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

describe('send acknowledgement error event', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should send invalid bank details error event if hold category is bank account anomaly', async () => {
    await sendAcknowledgementErrorEvent(BANK_ACCOUNT_ANOMALY, acknowledgement, paymentRequest)
    expect(mockSendAckInvalidBankDetailsErrorEvent).toHaveBeenCalledWith(paymentRequest)
  })

  test('should send processing acknowledgement error event if hold category is not bank account anomaly', async () => {
    const holdCategoryName = 'OTHER_CATEGORY'
    await sendAcknowledgementErrorEvent(holdCategoryName, acknowledgement, paymentRequest)
    expect(mockSendProcessingAckErrorEvent).toHaveBeenCalledWith(acknowledgement)
  })

  test('should not send processing acknowledgement error event if hold category is bank account anomaly', async () => {
    await sendAcknowledgementErrorEvent(BANK_ACCOUNT_ANOMALY, acknowledgement, paymentRequest)
    expect(mockSendProcessingAckErrorEvent).not.toHaveBeenCalled()
  })

  test('should not send invalid bank details error event if hold category is not bank account anomaly', async () => {
    const holdCategoryName = 'OTHER_CATEGORY'
    await sendAcknowledgementErrorEvent(holdCategoryName, acknowledgement, paymentRequest)
    expect(mockSendAckInvalidBankDetailsErrorEvent).not.toHaveBeenCalled()
  })
})
