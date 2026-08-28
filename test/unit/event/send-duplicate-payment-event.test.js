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
const { DUPLICATE_PAYMENT } = require('../../../app/constants/events')
const { sendDuplicatePaymentEvent } = require('../../../app/event')

const REFERENCE_ID = '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c'

let paymentRequest

beforeEach(() => {
  jest.clearAllMocks()
  paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
  messageConfig.eventsTopic = 'v2-events'
})

describe('send events for duplicate payment requests', () => {
  const expectations = [
    ['V2 topic', (event) => expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)],
    ['processing source', (event) => expect(event.source).toBe(SOURCE)],
    ['event type', (event) => expect(event.type).toBe(DUPLICATE_PAYMENT)],
    ['invoice number subject', (event) => expect(event.subject).toBe(paymentRequest.invoiceNumber)],
    ['duplicate payment data', (event) => expect(event.data).toEqual({
      message: 'Duplicate payment request received for invoice number:',
      invoiceNumber: paymentRequest.invoiceNumber,
      referenceId: REFERENCE_ID,
      sourceSystem: paymentRequest.sourceSystem,
      schemeId: paymentRequest.schemeId
    })]
  ]

  test.each(expectations)('should validate %s', async (_desc, assertion) => {
    await sendDuplicatePaymentEvent(paymentRequest, REFERENCE_ID)
    const event = mockPublishEvent.mock.calls[0][0]
    assertion(event)
  })
})
