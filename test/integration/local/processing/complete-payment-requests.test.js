const { resetDatabase } = require('../../../helpers')
const db = require('../../../../app/database')
const { completePaymentRequests } = require('../../../../app/processing/complete-payment-requests')
const { sendZeroValueEvent } = require('../../../../app/event')

jest.mock('../../../../app/event')

const saveSchedule = async schedule => {
  const [savedSchedule] = await db.schedule().insert(schedule).returning('scheduleId')
  return { scheduleId: savedSchedule.scheduleId }
}

describe('complete payment requests', () => {
  let paymentRequest

  beforeEach(async () => {
    await resetDatabase()

    paymentRequest = {
      invoiceNumber: 'S12345678',
      value: 100,
      invoiceLines: [{ value: 100 }]
    }
  })

  afterEach(() => jest.clearAllMocks())

  describe('schedule handling', () => {
    test.each([
      ['already complete', () => ({
        started: new Date('2025-01-01T00:00:00Z'),
        completed: new Date('2025-01-02T00:00:00Z')
      }), 'existing'],
      ['in progress', () => ({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      }), 'new']
    ])('should handle schedule correctly when %s', async (_desc, scheduleFn, type) => {
      const schedule = scheduleFn()
      const { scheduleId } = await saveSchedule(schedule)

      await completePaymentRequests(scheduleId, [paymentRequest])
      const saved = await db.schedule().where({ scheduleId }).first()

      if (type === 'existing') {
        expect(saved.completed).toBeInstanceOf(Date)
      } else {
        expect(saved.completed).not.toBeNull()
      }
    })
  })

  describe('payment request processing', () => {
    test('should create completed payment request', async () => {
      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const requests = await db.completedPaymentRequest()
      expect(requests.length).toBe(1)
    })

    test('should default completed payment request to valid', async () => {
      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const request = await db.completedPaymentRequest().first()
      expect(request.invalid).toBe(false)
    })

    test('should ignore payment request fields that are not columns', async () => {
      paymentRequest.scheme = { name: 'SFI' }
      paymentRequest.invoiceLines = [{ value: 100, invoiceLineId: 1, paymentRequestId: 1, invalid: false }]

      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const lines = await db.completedInvoiceLine()
      expect(lines.length).toBe(1)
    })

    test('should create multiple requests for split payments', async () => {
      paymentRequest.invoiceLines = [{ value: 100 }, { value: -100 }]
      paymentRequest.originalInvoiceNumber = null

      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const requests = await db.completedPaymentRequest()
      expect(requests.length).toBe(2)
    })
  })

  describe('invoice line handling', () => {
    test.each([
      ['non-zero lines', [{ value: 100 }], 1],
      ['zero lines', [{ value: 0 }], 0]
    ])('should handle invoice lines correctly when %s', async (_desc, lines, expectedLength) => {
      paymentRequest.invoiceLines = lines

      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const savedLines = await db.completedInvoiceLine()
      expect(savedLines.length).toBe(expectedLength)
    })
  })

  describe('outbox handling', () => {
    test.each([
      ['non-zero value', [{ value: 100 }], 1, 0],
      ['offsetting values', [{ value: 100 }, { value: -100 }], 2, 0],
      ['pure zero value', [{ value: 0 }], 1, 1]
    ])('should handle outbox for %s', async (_desc, lines, completedReqs, zeroEventCalls) => {
      paymentRequest.invoiceLines = lines
      paymentRequest.value = lines.reduce((sum, l) => sum + l.value, 0)

      const { scheduleId } = await saveSchedule({
        started: new Date('2026-01-01T18:00:00Z'),
        completed: null
      })

      await completePaymentRequests(scheduleId, [paymentRequest])

      const completed = await db.completedPaymentRequest()
      const outbox = await db.outbox()

      expect(completed.length).toBe(completedReqs)
      expect(sendZeroValueEvent).toHaveBeenCalledTimes(zeroEventCalls)

      if (zeroEventCalls === 1) {
        expect(outbox.length).toBe(0)
      }
    })
  })
})
