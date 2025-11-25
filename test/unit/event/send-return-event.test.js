const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvent: mockPublishEvent
  }
})

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

jest.mock('../../../app/processing/get-payment-request-by-invoice-frn')
const { getPaymentRequestByInvoiceAndFrn } = require('../../../app/processing/get-payment-request-by-invoice-frn')

jest.mock('../../../app/config')
const { messageConfig } = require('../../../app/config')

const { PAYMENT_SETTLEMENT_UNMATCHED, PAYMENT_SETTLEMENT_UNSETTLED, PAYMENT_SETTLED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendProcessingReturnEvent } = require('../../../app/event/send-return-event')

let paymentRequest
let settlement

describe('V2 acknowledgement error event', () => {
  beforeEach(() => {
    paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    settlement = structuredClone(require('../../mocks/settlements/settlement'))
    getPaymentRequestByInvoiceAndFrn.mockResolvedValue(paymentRequest)
    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Event publishing', () => {
    test.each([
      ['unmatched', true],
      ['matched', false],
      ['unsettled', true, false]
    ])('should send %s settlement event to V2 topic', async (_, isUnmatched, isSettled = true) => {
      settlement.settled = isSettled
      await sendProcessingReturnEvent(settlement, isUnmatched)
      expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
    })
  })

  describe('Event source', () => {
    test.each([
      ['unmatched', true],
      ['matched', false],
      ['unsettled', true, false]
    ])('should raise %s settlement event with processing source', async (_, isUnmatched, isSettled = true) => {
      settlement.settled = isSettled
      await sendProcessingReturnEvent(settlement, isUnmatched)
      expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
    })
  })

  describe('Event type', () => {
    test.each([
      ['unmatched', true, PAYMENT_SETTLEMENT_UNMATCHED],
      ['matched', false, PAYMENT_SETTLED],
      ['unsettled', true, PAYMENT_SETTLEMENT_UNSETTLED, false]
    ])('should raise correct event type for %s settlement', async (_, isUnmatched, expectedType, isSettled = true) => {
      settlement.settled = isSettled
      await sendProcessingReturnEvent(settlement, isUnmatched)
      expect(mockPublishEvent.mock.calls[0][0].type).toBe(expectedType)
    })
  })

  describe('Event data', () => {
    test('should include unmatched warning for unmatched settlement', async () => {
      await sendProcessingReturnEvent(settlement, true)
      expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual(
        'Unable to find payment request for settlement, Invoice number: S12345678C1234567V001 FRN: 1234567890'
      )
    })

    test('should include unsettled warning for unsuccessful settlement', async () => {
      settlement.settled = false
      await sendProcessingReturnEvent(settlement, true)
      expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual(
        'D365 has reported a settlement for Invoice number S12345678C1234567V001, FRN 1234567890 was unsuccessful'
      )
    })

    test('should include payment request data for matched settlement', async () => {
      await sendProcessingReturnEvent(settlement)
      expect(mockPublishEvent.mock.calls[0][0].data).toEqual(paymentRequest)
    })
  })
})
