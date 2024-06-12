const { resetDatabase, closeDatabaseConnection, saveSchedule } = require('../../../helpers')

const inProgressSchedule = require('../../../mocks/schedules/in-progress')
const completedSchedule = require('../../../mocks/schedules/completed')

const db = require('../../../../app/data')

jest.mock('../../../../app/event/send-zero-value-event')
const { sendZeroValueEvent } = require('../../../../app/event/send-zero-value-event')

const { completePaymentRequests } = require('../../../../app/processing/complete-payment-requests')

let paymentRequest

describe('complete payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should update schedule as complete', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const updatedSchedule = await db.schedule.findByPk(scheduleId)
    expect(updatedSchedule.completed).not.toBeNull()
  })

  test('should create completed payment request', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedPaymentRequests = await db.completedPaymentRequest.findAll()
    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should create completed invoice line', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedInvoiceLines = await db.completedInvoiceLine.findAll()
    expect(completedInvoiceLines.length).toBe(paymentRequest.invoiceLines.length)
  })

  test('should create completed payment request with values', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId
      }
    })
    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should create completed invoice line with values', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        description: paymentRequest.invoiceLines[0].description
      }
    })
    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should create multiple payment requests', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest, paymentRequest])
    const completedPaymentRequests = await db.completedPaymentRequest.findAll()
    expect(completedPaymentRequests.length).toBe(2)
  })

  test('should create multiple invoice lines for multiple requests', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest, paymentRequest])
    const completedInvoiceLines = await db.completedInvoiceLine.findAll()
    expect(completedInvoiceLines.length).toBe(paymentRequest.invoiceLines.length * 2)
  })

  test('should not create completed payment request if already complete', async () => {
    const { scheduleId } = await saveSchedule(completedSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedPaymentRequests = await db.completedPaymentRequest.findAll()
    expect(completedPaymentRequests.length).toBe(0)
  })

  test('should not create completed invoice lines if already complete', async () => {
    const { scheduleId } = await saveSchedule(completedSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedInvoiceLines = await db.completedInvoiceLine.findAll()
    expect(completedInvoiceLines.length).toBe(0)
  })

  test('should not update schedule if already complete', async () => {
    const { scheduleId } = await saveSchedule(completedSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const updatedSchedule = await db.schedule.findByPk(scheduleId)
    expect(updatedSchedule.completed).toStrictEqual(completedSchedule.completed)
  })

  test('should not save invoice lines with zero value', async () => {
    paymentRequest.invoiceLines[0].value = 0
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const completedInvoiceLines = await db.completedInvoiceLine.findAll()
    expect(completedInvoiceLines.length).toBe(0)
  })

  test('should not create outbox record if all invoice lines have zero value', async () => {
    paymentRequest.invoiceLines[0].value = 0
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const outbox = await db.outbox.findAll()
    expect(outbox.length).toBe(0)
  })

  test('should not create outbox record if no invoice lines', async () => {
    paymentRequest.invoiceLines = []
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    const outbox = await db.outbox.findAll()
    expect(outbox.length).toBe(0)
  })

  test('should call sendZeroValueEvent if all invoice lines have zero value', async () => {
    paymentRequest.invoiceLines[0].value = 0
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    expect(sendZeroValueEvent).toHaveBeenCalledWith(paymentRequest)
  })

  test('should log message if all invoice lines have zero value', async () => {
    const consoleSpy = jest.spyOn(console, 'log')
    paymentRequest.invoiceLines[0].value = 0
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await completePaymentRequests(scheduleId, [paymentRequest])
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Payment request processed with no change to report:'),
      expect.anything()
    )
    consoleSpy.mockRestore()
  })
})
