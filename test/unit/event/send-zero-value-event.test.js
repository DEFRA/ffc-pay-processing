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
const { PAYMENT_PROCESSED_NO_FURTHER_ACTION } = require('../../../app/constants/events')
const { sendZeroValueEvent } = require('../../../app/event')

let paymentRequest

beforeEach(() => {
  jest.clearAllMocks()
  paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
  messageConfig.eventsTopic = 'v2-events'
})

describe('send events for zero value payment requests', () => {
  const expectations = [
    ['V2 topic', (event) => expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)],
    ['processing source', (event) => expect(event.source).toBe(SOURCE)],
    ['event type', (event) => expect(event.type).toBe(PAYMENT_PROCESSED_NO_FURTHER_ACTION)],
    ['payment request data', (event) => expect(event.data).toMatchObject(paymentRequest)]
  ]

  test.each(expectations)('should validate %s', async (_desc, assertion) => {
    await sendZeroValueEvent(paymentRequest)
    const event = mockPublishEvent.mock.calls[0][0]
    assertion(event)
  })
})
