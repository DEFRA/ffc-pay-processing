const mockSendAckInvalidBankDetailsErrorEvent = jest.fn()
const mockSendProcessingAckErrorEvent = jest.fn()

jest.mock('../../../app/event/send-ack-invalid-bank-details-error-event', () => ({
  sendAckInvalidBankDetailsErrorEvent: mockSendAckInvalidBankDetailsErrorEvent
}))

jest.mock('../../../app/event/send-ack-error-event', () => ({
  sendProcessingAckErrorEvent: mockSendProcessingAckErrorEvent
}))

const { BANK_ACCOUNT_ANOMALY } = require('../../../app/constants/hold-categories-names')
const { sendAcknowledgementErrorEvent } = require('../../../app/event/send-acknowledgement-error-event')

const acknowledgement = require('../../mocks/acknowledgement')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

describe('send acknowledgement error event', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('sends invalid bank details error event when hold category is bank account anomaly', async () => {
    await sendAcknowledgementErrorEvent(BANK_ACCOUNT_ANOMALY, acknowledgement, paymentRequest)

    expect(mockSendAckInvalidBankDetailsErrorEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAckInvalidBankDetailsErrorEvent).toHaveBeenCalledWith(paymentRequest)

    expect(mockSendProcessingAckErrorEvent).not.toHaveBeenCalled()
  })

  test('sends processing acknowledgement error event when hold category is not bank account anomaly', async () => {
    const holdCategoryName = 'OTHER_CATEGORY'

    await sendAcknowledgementErrorEvent(holdCategoryName, acknowledgement, paymentRequest)

    expect(mockSendProcessingAckErrorEvent).toHaveBeenCalledTimes(1)
    expect(mockSendProcessingAckErrorEvent).toHaveBeenCalledWith(acknowledgement)

    expect(mockSendAckInvalidBankDetailsErrorEvent).not.toHaveBeenCalled()
  })
})
