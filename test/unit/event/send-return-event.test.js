const mockSendEvent = jest.fn()
const mockPublishEvent = jest.fn()
const MockPublishEvent = jest.fn().mockImplementation(() => {
  return {
    sendEvent: mockSendEvent
  }
})
const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvent: mockPublishEvent
  }
})
jest.mock('ffc-pay-event-publisher', () => {
  return {
    PublishEvent: MockPublishEvent,
    EventPublisher: MockEventPublisher
  }
})
jest.mock('../../../app/processing/get-payment-request-by-invoice-frn')
const { getPaymentRequestByInvoiceAndFrn } = require('../../../app/processing/get-payment-request-by-invoice-frn')
jest.mock('../../../app/config')
const { processingConfig, messageConfig } = require('../../../app/config')

const { PAYMENT_SETTLEMENT_UNMATCHED, PAYMENT_SETTLED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendProcessingReturnEvent } = require('../../../app/event/send-return-event')

let paymentRequest
let settlement

beforeEach(() => {
  paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
  settlement = JSON.parse(JSON.stringify(require('../../mocks/settlement')))

  getPaymentRequestByInvoiceAndFrn.mockResolvedValue(paymentRequest)

  processingConfig.useV2Events = true
  messageConfig.eventsTopic = 'v2-events'
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('V2 acknowledgement error event', () => {
  test('should send V2 event for unmatched settlement if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should send V2 event for matched settlement if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent).toHaveBeenCalled()
  })

  test('should not send V2 event for unmatched settlement if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should not send V2 event for matched settlement if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent).not.toHaveBeenCalled()
  })

  test('should send unmatched settlement event to V2 topic', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should send matched settlement event to V2 topic', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise unmatched settlement event with processing source', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise matched settlement event with processing source', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise unmatched event type for unmatched settlement', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLEMENT_UNMATCHED)
  })

  test('should raise payment invalid bank event type for matched settlement', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLED)
  })

  test('should include unmatched warning for unmatched settlement', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual('Unable to find payment request for settlement, Invoice: S12345678C1234567V001, FRN: 1234567890')
  })

  test('should include payment request data for matched settlement', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent.mock.calls[0][0].data).toEqual(paymentRequest)
  })
})
