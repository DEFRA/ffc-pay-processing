const mockPublishedEvents = []

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: jest.fn().mockImplementation(() => ({
    publishEvent: jest.fn(async (event) => { mockPublishedEvents.push(event) }),
    publishEvents: jest.fn(async (events) => { mockPublishedEvents.push(...events) })
  }))
}))

const { resetDatabase, closeDatabaseConnection, savePaymentRequest, isEventHubPaymentEvent } = require('../../../helpers')

const db = require('../../../../app/database')

const { processPaymentMessage } = require('../../../../app/messaging/process-payment-message')
const { processAcknowledgementMessage } = require('../../../../app/messaging/process-acknowledgement-message')
const { processReturnMessage } = require('../../../../app/messaging/process-return-message')

const {
  DUPLICATE_PAYMENT_WARNING,
  PAYMENT_DAX_REJECTED,
  PAYMENT_INVALID_BANK,
  PAYMENT_PROCESSING_FAILED,
  PAYMENT_SETTLEMENT_UNSETTLED
} = require('../../../../app/constants/events')
const { BANK_ACCOUNT_ANOMALY, DAX_REJECTION } = require('../../../../app/constants/hold-categories-names')
const { INVALID_BANK_DETAILS } = require('../../../../app/constants/dax-rejections')
const { TIMESTAMP } = require('../../../mocks/values/date')

let paymentRequest
let receiver

const getPublishedEvent = (type) => mockPublishedEvents.find(event => event.type === type)

const expectPaymentIdentifiers = (event) => {
  // frn is read back from a BIGINT column as a string, which event hub converts
  expect(Number(event.data.frn)).toBe(paymentRequest.frn)
  expect(event.data.correlationId).toBe(paymentRequest.correlationId)
  expect(event.data.schemeId).toBe(paymentRequest.schemeId)
  expect(event.data.invoiceNumber).toBe(paymentRequest.invoiceNumber)
}

const countPaymentRequests = async () => {
  const [{ count }] = await db.paymentRequest().count({ count: '*' })
  return Number(count)
}

describe('payment warning events', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockPublishedEvents.length = 0

    await resetDatabase()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    receiver = {
      completeMessage: jest.fn(),
      deadLetterMessage: jest.fn()
    }
  })

  describe('duplicate payment request', () => {
    beforeEach(async () => {
      await processPaymentMessage({ body: structuredClone(paymentRequest) }, receiver)
      mockPublishedEvents.length = 0
      await processPaymentMessage({ body: structuredClone(paymentRequest) }, receiver)
    })

    test('should publish duplicate payment warning with payment identifiers', () => {
      const event = getPublishedEvent(DUPLICATE_PAYMENT_WARNING)
      expect(event).toBeDefined()
      expectPaymentIdentifiers(event)
    })

    test('should publish duplicate payment warning event hub can save against payment', () => {
      expect(isEventHubPaymentEvent(getPublishedEvent(DUPLICATE_PAYMENT_WARNING))).toBe(true)
    })

    test('should only publish one event for duplicate', () => {
      expect(mockPublishedEvents).toHaveLength(1)
    })
  })

  describe('payment request fails processing', () => {
    beforeEach(async () => {
      delete paymentRequest.invoiceLines
      await processPaymentMessage({ body: paymentRequest }, receiver)
    })

    test('should publish processing failed warning with payment identifiers', () => {
      const event = getPublishedEvent(PAYMENT_PROCESSING_FAILED)
      expect(event).toBeDefined()
      expectPaymentIdentifiers(event)
    })

    test('should publish processing failed warning event hub can save against payment', () => {
      expect(isEventHubPaymentEvent(getPublishedEvent(PAYMENT_PROCESSING_FAILED))).toBe(true)
    })

    test('should not save payment request', async () => {
      expect(await countPaymentRequests()).toBe(0)
    })
  })

  describe('acknowledgement rejected for invalid bank details', () => {
    beforeEach(async () => {
      await db.holdCategory().insert({ holdCategoryId: 100, schemeId: paymentRequest.schemeId, name: BANK_ACCOUNT_ANOMALY })
      await savePaymentRequest(paymentRequest, true)
      await processAcknowledgementMessage({
        body: {
          invoiceNumber: paymentRequest.invoiceNumber,
          frn: paymentRequest.frn,
          success: false,
          acknowledged: TIMESTAMP,
          message: INVALID_BANK_DETAILS
        }
      }, receiver)
    })

    test('should publish invalid bank warning with payment identifiers', () => {
      const event = getPublishedEvent(PAYMENT_INVALID_BANK)
      expect(event).toBeDefined()
      expectPaymentIdentifiers(event)
    })

    test('should publish invalid bank warning event hub can save against payment', () => {
      expect(isEventHubPaymentEvent(getPublishedEvent(PAYMENT_INVALID_BANK))).toBe(true)
    })

    test('should not publish processing failed warning', () => {
      expect(getPublishedEvent(PAYMENT_PROCESSING_FAILED)).toBeUndefined()
    })

    test('should complete message', () => {
      expect(receiver.completeMessage).toHaveBeenCalled()
    })
  })

  describe('acknowledgement rejected by DAX', () => {
    beforeEach(async () => {
      await db.holdCategory().insert({ holdCategoryId: 101, schemeId: paymentRequest.schemeId, name: DAX_REJECTION })
      await savePaymentRequest(paymentRequest, true)
      await processAcknowledgementMessage({
        body: {
          invoiceNumber: paymentRequest.invoiceNumber,
          frn: paymentRequest.frn,
          success: false,
          acknowledged: TIMESTAMP,
          message: 'Journal could not be posted'
        }
      }, receiver)
    })

    test('should publish DAX rejected warning with payment identifiers', () => {
      const event = getPublishedEvent(PAYMENT_DAX_REJECTED)
      expect(event).toBeDefined()
      expectPaymentIdentifiers(event)
    })

    test('should publish DAX rejected warning event hub can save against payment', () => {
      expect(isEventHubPaymentEvent(getPublishedEvent(PAYMENT_DAX_REJECTED))).toBe(true)
    })

    test('should not publish processing failed warning', () => {
      expect(getPublishedEvent(PAYMENT_PROCESSING_FAILED)).toBeUndefined()
    })
  })

  describe('settlement unsuccessful', () => {
    let settlement

    beforeEach(() => {
      settlement = structuredClone(require('../../../mocks/settlements/settlement'))
      settlement.settled = false
    })

    describe('when payment request exists', () => {
      beforeEach(async () => {
        await savePaymentRequest(paymentRequest, true)
        await processReturnMessage({ body: settlement }, receiver)
      })

      test('should publish unsettled warning with payment identifiers', () => {
        const event = getPublishedEvent(PAYMENT_SETTLEMENT_UNSETTLED)
        expect(event).toBeDefined()
        expectPaymentIdentifiers(event)
      })

      test('should publish unsettled warning with payment request details', () => {
        const event = getPublishedEvent(PAYMENT_SETTLEMENT_UNSETTLED)
        expect(event.data.agreementNumber).toBe(paymentRequest.agreementNumber)
        expect(event.data.batch).toBe(paymentRequest.batch)
        expect(event.data.message).toBe(`D365 has reported a settlement for Invoice number ${settlement.invoiceNumber}, FRN ${settlement.frn} was unsuccessful`)
      })

      test('should publish unsettled warning event hub can save against payment', () => {
        expect(isEventHubPaymentEvent(getPublishedEvent(PAYMENT_SETTLEMENT_UNSETTLED))).toBe(true)
      })

      test('should dead letter message', () => {
        expect(receiver.deadLetterMessage).toHaveBeenCalled()
      })
    })

    describe('when payment request does not exist', () => {
      beforeEach(async () => {
        await processReturnMessage({ body: settlement }, receiver)
      })

      test('should still publish unsettled warning', () => {
        const event = getPublishedEvent(PAYMENT_SETTLEMENT_UNSETTLED)
        expect(event).toBeDefined()
        expect(event.data.frn).toBe(settlement.frn)
        expect(event.data.invoiceNumber).toBe(settlement.invoiceNumber)
      })

      test('should publish unsettled warning event hub cannot save against payment', () => {
        expect(isEventHubPaymentEvent(getPublishedEvent(PAYMENT_SETTLEMENT_UNSETTLED))).toBe(false)
      })
    })
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
