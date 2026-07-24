const mockPublishEvent = jest.fn()
const mockSendReturnResponse = jest.fn()

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
const { messageConfig } = require('../../../app/config')

jest.mock('../../../app/messaging/send-return-response', () => ({
  sendReturnResponse: mockSendReturnResponse
}))

const { PAYMENT_ACKNOWLEDGED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendAckEvent } = require('../../../app/event/send-ack-event')

let paymentRequest
let acknowledgement

describe('V2 ack event', () => {
  beforeEach(() => {
    paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    acknowledgement = structuredClone(require('../../mocks/acknowledgement'))

    getPaymentRequestByInvoiceAndFrn.mockResolvedValue(paymentRequest)
    mockSendReturnResponse.mockResolvedValue()

    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send event to V2 topic', async () => {
    await sendAckEvent(acknowledgement)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise an event with processing source', async () => {
    await sendAckEvent(acknowledgement)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise acknowledged payment event type', async () => {
    await sendAckEvent(acknowledgement)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_ACKNOWLEDGED)
  })

  test('should include payment request in event data', async () => {
    await sendAckEvent(acknowledgement)
    expect(mockPublishEvent.mock.calls[0][0].data).toEqual(paymentRequest)
  })

  test('should call sendReturnResponse with paymentRequest and PAYMENT_ACKNOWLEDGED event type', async () => {
    await sendAckEvent(acknowledgement)
    expect(mockSendReturnResponse).toHaveBeenCalledWith(paymentRequest, PAYMENT_ACKNOWLEDGED)
  })
})
