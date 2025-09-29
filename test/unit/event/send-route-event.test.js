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
const { messageConfig } = require('../../../app/config')

const { PAYMENT_PAUSED_PREFIX } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendProcessingRouteEvent } = require('../../../app/event/send-route-event')

let paymentRequest
let routeLocationDebt
let routeLocationLedger
let routeTypeRequest
let routeTypeResponse

describe('V2 route event', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))

    routeLocationDebt = 'debt'
    routeLocationLedger = 'manual-ledger'
    routeTypeRequest = 'request'
    routeTypeResponse = 'response'

    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send debt routing event to V2 topic', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationDebt, routeTypeRequest)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should send ledger routing event to V2 topic', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationLedger, routeTypeRequest)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should not send event if response', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationLedger, routeTypeResponse)
    expect(MockEventPublisher).not.toHaveBeenCalled()
  })

  test('should raise debt routing event with processing source', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationDebt, routeTypeRequest)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise ledger routing event with processing source', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationLedger, routeTypeRequest)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise debt route event type for debt routing', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationDebt, routeTypeRequest)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(`${PAYMENT_PAUSED_PREFIX}.debt`)
  })

  test('should raise ledger route event type for ledger routing', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationLedger, routeTypeRequest)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(`${PAYMENT_PAUSED_PREFIX}.ledger`)
  })

  test('should include payment request data for ledger routing', async () => {
    await sendProcessingRouteEvent(paymentRequest, routeLocationLedger, routeTypeRequest)
    expect(mockPublishEvent.mock.calls[0][0].data).toEqual(paymentRequest)
  })
})
