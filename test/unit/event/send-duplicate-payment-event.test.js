const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => ({
  publishEvent: mockPublishEvent
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

jest.mock('../../../app/config')
const { messageConfig } = require('../../../app/config')

const { SOURCE } = require('../../../app/constants/source')
const { DUPLICATE_PAYMENT_WARNING } = require('../../../app/constants/events')
const { sendDuplicatePaymentEvent } = require('../../../app/event')

const REFERENCE_ID = '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c'
const MESSAGE = 'Duplicate payment request received for invoice number:'

let paymentRequest

const getEvent = () => mockPublishEvent.mock.calls[0][0]

beforeEach(() => {
  jest.clearAllMocks()
  paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
  messageConfig.eventsTopic = 'v2-events'
})

describe('send event for duplicate payment requests', () => {
  test('should send event to V2 topic', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise a single warning event', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    expect(getEvent().type).toBe(DUPLICATE_PAYMENT_WARNING)
  })

  test('should raise event with processing source', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    expect(getEvent().source).toBe(SOURCE)
  })

  test('should raise event with invoice number subject', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    expect(getEvent().subject).toBe(paymentRequest.invoiceNumber)
  })

  test('should raise warning event with payment request data', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    expect(getEvent().data).toEqual({
      ...paymentRequest,
      message: MESSAGE,
      referenceId: REFERENCE_ID
    })
  })

  test('should raise warning event with identifiers needed to link it to the payment request', async () => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    const { data } = getEvent()
    expect(data.frn).toBe(paymentRequest.frn)
    expect(data.correlationId).toBe(paymentRequest.correlationId)
    expect(data.schemeId).toBe(paymentRequest.schemeId)
    expect(data.invoiceNumber).toBe(paymentRequest.invoiceNumber)
  })
})
