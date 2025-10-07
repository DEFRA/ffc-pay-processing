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
const { messageConfig } = require('../../../app/config')

const frn = require('../../mocks/values/frn')

const { PAYMENT_DAX_REJECTED, PAYMENT_INVALID_BANK } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendAcknowledgementErrorEvent } = require('../../../app/event/send-acknowledgement-error-event')

let paymentRequest
let acknowledgement
let holdCategoryNameDR
let holdCategoryNameBAA

describe('V2 acknowledgement error event', () => {
  beforeEach(() => {
    paymentRequest = JSON.parse(JSON.stringify(require('../../mocks/payment-requests/payment-request')))
    acknowledgement = JSON.parse(JSON.stringify(require('../../mocks/acknowledgement')))
    holdCategoryNameDR = JSON.parse(JSON.stringify(require('../../../app/constants/hold-categories-names'))).DAX_REJECTION
    holdCategoryNameBAA = JSON.parse(JSON.stringify(require('../../../app/constants/hold-categories-names'))).BANK_ACCOUNT_ANOMALY

    getPaymentRequestByInvoiceAndFrn.mockResolvedValue(paymentRequest)

    messageConfig.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send DAX rejection event to V2 topic', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameDR, acknowledgement, frn)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should send bank account anomaly event to V2 topic', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameBAA, acknowledgement, frn)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(messageConfig.eventsTopic)
  })

  test('should raise DAX rejection event with processing source', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameDR, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise bank account anomaly event with processing source', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameBAA, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise DAX rejected event type for DAX rejection', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameDR, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_DAX_REJECTED)
  })

  test('should raise payment invalid bank event type for bank account anomaly', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameBAA, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(PAYMENT_INVALID_BANK)
  })

  test('should include payment request rejected message from DAX for DAX rejection', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameDR, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual(acknowledgement.message)
  })

  test('should include no valid bank details message for bank account anomaly', async () => {
    await sendAcknowledgementErrorEvent(holdCategoryNameBAA, acknowledgement, frn)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toEqual('No valid bank details held')
  })
})
