const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => ({
  publishEvent: mockPublishEvent
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

jest.mock('../../../app/config')
const { messageConfig } = require('../../../app/config')

const { PAYMENT_PAUSED_PREFIX } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendProcessingRouteEvent } = require('../../../app/event/send-route-event')

let paymentRequest

beforeEach(() => {
  jest.clearAllMocks()
  paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
  messageConfig.eventsTopic = 'v2-events'
})

describe('V2 route events', () => {
  const scenarios = [
    ['debt', 'request', true, `${PAYMENT_PAUSED_PREFIX}.debt`],
    ['manual-ledger', 'request', true, `${PAYMENT_PAUSED_PREFIX}.ledger`],
    ['manual-ledger', 'response', false, null]
  ]

  test.each(scenarios)(
    'should handle routing event for location: %s, type: %s',
    async (routeLocation, routeType, shouldPublish, expectedType) => {
      await sendProcessingRouteEvent(paymentRequest, routeLocation, routeType)

      if (shouldPublish) {
        const event = mockPublishEvent.mock.calls[0][0]
        expect(MockEventPublisher).toHaveBeenCalledWith(messageConfig.eventsTopic)
        expect(event.source).toBe(SOURCE)
        expect(event.type).toBe(expectedType)
        expect(event.data).toEqual(paymentRequest)
      } else {
        expect(MockEventPublisher).not.toHaveBeenCalled()
      }
    }
  )
})
