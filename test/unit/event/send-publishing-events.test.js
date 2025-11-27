const mockPublishEvents = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => ({
  publishEvents: mockPublishEvents
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

jest.mock('../../../app/config')
const { messageConfig } = require('../../../app/config')

const { PAYMENT_PROCESSED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendPublishingEvents } = require('../../../app/event/send-publishing-events')

let paymentRequest
let paymentRequests

describe('V2 publishing events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    paymentRequests = [paymentRequest, paymentRequest]

    messageConfig.eventsTopic = 'v2-events'
  })

  test('should send events to V2 topic', async () => {
    await sendPublishingEvents(paymentRequests)
    expect(MockEventPublisher).toHaveBeenCalledWith(messageConfig.eventsTopic)
  })

  test('should include an event for each payment request', async () => {
    await sendPublishingEvents(paymentRequests)
    const events = mockPublishEvents.mock.calls[0][0]
    expect(events).toHaveLength(paymentRequests.length)
  })

  test.each([0, 1])(
    'event %i should have correct source, type and data',
    async (index) => {
      await sendPublishingEvents(paymentRequests)
      const event = mockPublishEvents.mock.calls[0][0][index]

      expect(event.source).toBe(SOURCE)
      expect(event.type).toBe(PAYMENT_PROCESSED)
      expect(event.data).toEqual(paymentRequest)
    }
  )
})
