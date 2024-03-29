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

const { PAYMENT_SUPPRESSED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendSuppressedEvent } = require('../../../app/event/send-suppressed-event')

let paymentRequest
let deltaPaymentRequest

describe('V2 route event', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    deltaPaymentRequest = paymentRequest
    deltaPaymentRequest.value = -50

    processingConfig.useV2Events = true
    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send V2 event for suppressed AR if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendSuppressedEvent(paymentRequest, { deltaPaymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send V2 event for suppressed AR if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    await sendSuppressedEvent(paymentRequest, { deltaPaymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send suppressed AR event to V2 topic', async () => {
    await sendSuppressedEvent(paymentRequest, { deltaPaymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise suppressed AR event with processing source', async () => {
    await sendSuppressedEvent(paymentRequest, { deltaPaymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise suppressed event type', async () => {
    await sendSuppressedEvent(paymentRequest, { deltaPaymentRequest, completedPaymentRequests: [paymentRequest] })
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(`${PAYMENT_SUPPRESSED}`)
  })
})
