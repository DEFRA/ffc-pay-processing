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
const { PAYMENT_PROCESSED_NO_FURTHER_ACTION } = require('../../../app/constants/events')
const { sendZeroValueEvent } = require('../../../app/event')

let paymentRequest

describe('send events for zero value payment requests', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    processingConfig.useV2Events = true
    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send V2 event if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendZeroValueEvent(paymentRequest)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send V2 event if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    await sendZeroValueEvent(paymentRequest)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send event to V2 topic', async () => {
    await sendZeroValueEvent(paymentRequest)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise event with processing source', async () => {
    await sendZeroValueEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise event with type PAYMENT_PROCESSED_NO_FURTHER_ACTION', async () => {
    await sendZeroValueEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_PROCESSED_NO_FURTHER_ACTION)
  })

  test('should raise event with payment request data', async () => {
    await sendZeroValueEvent(paymentRequest)
    expect(mockPublishEvent.mock.calls[0][0].data).toMatchObject(paymentRequest)
  })
})
