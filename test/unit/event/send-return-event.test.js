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

jest.mock('../../../app/processing/get-payment-request-by-invoice-frn')
const { getPaymentRequestByInvoiceAndFrn } = require('../../../app/processing/get-payment-request-by-invoice-frn')

jest.mock('../../../app/config')
const { processingConfig, messageConfig } = require('../../../app/config')

const { PAYMENT_SETTLEMENT_UNMATCHED, PAYMENT_SETTLEMENT_UNSETTLED, PAYMENT_SETTLED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendProcessingReturnEvent } = require('../../../app/event/send-return-event')

let paymentRequest
let settlement

describe('V2 acknowledgement error event', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    settlement = JSON.parse(JSON.stringify(require('../../mocks/settlements/settlement')))

    getPaymentRequestByInvoiceAndFrn.mockResolvedValue(paymentRequest)

    processingConfig.useV2Events = true
    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send V2 event for unmatched settlement if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent).toHaveBeenCalled()
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLEMENT_UNMATCHED)
  })

  test('should send V2 event for matched settlement if V2 events enabled', async () => {
    processingConfig.useV2Events = true
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent).toHaveBeenCalled()
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLED)
  })

  test('should send V2 event for unsettled settlement if V2 events enabled and settlement unsuccessful by D365', async () => {
    processingConfig.useV2Events = true
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent).toHaveBeenCalled()
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLEMENT_UNSETTLED)
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

  test('should not send V2 event for unsettled settlement if V2 events disabled', async () => {
    processingConfig.useV2Events = false
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
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

  test('should send unsettled settlement event to V2 topic', async () => {
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
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

  test('should raise unsettled settlement event with processing source', async () => {
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise unmatched event type for unmatched settlement', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLEMENT_UNMATCHED)
  })

  test('should raise payment settled event type for matched settlement', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLED)
  })

  test('should raise unsettled event type for unsuccessful settlement', async () => {
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_SETTLEMENT_UNSETTLED)
  })

  test('should include unmatched warning for unmatched settlement', async () => {
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual('Unable to find payment request for settlement, Invoice number: S12345678C1234567V001 FRN: 1234567890')
  })

  test('should include unsettled warning for unsuccessful settlement', async () => {
    settlement.settled = false
    await sendProcessingReturnEvent(settlement, true)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual('D365 has reported a settlement for Invoice number S12345678C1234567V001, FRN 1234567890 was unsuccessful')
  })

  test('should include payment request data for matched settlement', async () => {
    await sendProcessingReturnEvent(settlement)
    expect(mockPublishEvent.mock.calls[0][0].data).toEqual(paymentRequest)
  })
})
