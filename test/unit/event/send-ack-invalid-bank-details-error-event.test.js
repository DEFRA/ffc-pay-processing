const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvent: mockPublishEvent
  }
})

jest.mock('ffc-pay-event-publisher', () => {
  return {
    EventPublisher: MockEventPublisher
  }
})

jest.mock('../../../app/config')
const { processingConfig, messageConfig } = require('../../../app/config')

const { SOURCE } = require('../../../app/constants/source')
const { PAYMENT_INVALID_BANK } = require('../../../app/constants/events')

const { sendAckInvalidBankDetailsErrorEvent } = require('../../../app/event/send-ack-invalid-bank-details-error-event')

const paymentRequest = require('../../mocks/payment-requests/payment-request')

describe('send acknowledgement invalid bank details error event', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    processingConfig.useV2Events = true
    messageConfig.eventsTopic = 'v2-events'
  })

  test('should send V2 event if V2 events enabled', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send V2 event if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send event to V2 topic', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise event with processing source', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise payment invalid bank event type', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_INVALID_BANK)
  })

  test('should include no valid bank details message', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual('No valid bank details held')
  })

  test('should include payment request details in event data', async () => {
    await sendAckInvalidBankDetailsErrorEvent(paymentRequest)
    const eventData = mockPublishEvent.mock.calls[0][0].data
    expect(eventData.frn).toBe(paymentRequest.frn)
    expect(eventData.sourceSystem).toBe(paymentRequest.sourceSystem)
    expect(eventData.contractNumber).toBe(paymentRequest.contractNumber)
    expect(eventData.agreementNumber).toBe(paymentRequest.agreementNumber)
    expect(eventData.batch).toBe(paymentRequest.batch)
    expect(eventData.claimDate).toBe(paymentRequest.claimDate)
    expect(eventData.value).toBe(paymentRequest.value)
    expect(eventData.sbi).toBe(paymentRequest.sbi)
  })
})
