const mockPublishEvents = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvents: mockPublishEvents
  }
})

jest.mock('ffc-pay-event-publisher', () => {
  return {
    EventPublisher: MockEventPublisher
  }
})

jest.mock('../../../app/config')
const { messageConfig } = require('../../../app/config')

const { PAYMENT_PAUSED_HOLD } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendPaymentHoldEvents } = require('../../../app/event/send-payment-hold-events')

let paymentRequest

describe('send payment hold events', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send events to V2 topic', async () => {
    await sendPaymentHoldEvents([paymentRequest])
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise one event per payment request', async () => {
    await sendPaymentHoldEvents([paymentRequest, paymentRequest])
    expect(mockPublishEvents.mock.calls[0][0]).toHaveLength(2)
  })

  test('should raise event with processing source', async () => {
    await sendPaymentHoldEvents([paymentRequest])
    expect(mockPublishEvents.mock.calls[0][0][0].source).toBe(SOURCE)
  })

  test('should raise paused hold event type', async () => {
    await sendPaymentHoldEvents([paymentRequest])
    expect(mockPublishEvents.mock.calls[0][0][0].type).toBe(PAYMENT_PAUSED_HOLD)
  })

  test('should include payment request as event data', async () => {
    await sendPaymentHoldEvents([paymentRequest])
    expect(mockPublishEvents.mock.calls[0][0][0].data).toEqual(paymentRequest)
  })

  test('should not publish if there are no payment requests', async () => {
    await sendPaymentHoldEvents([])
    expect(MockEventPublisher).not.toHaveBeenCalled()
    expect(mockPublishEvents).not.toHaveBeenCalled()
  })
})
