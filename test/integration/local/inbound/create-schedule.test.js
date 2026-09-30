const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/data')

const { createSchedule } = require('../../../../app/inbound/create-schedule')

let paymentRequestId

describe('create schedule', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    try {
      await resetDatabase()
    } catch (error) {
      console.error({
        message: error.message,
        name: error.name,
        parentMessage: error.parent?.message,
        originalMessage: error.original?.message,
        detail: error.parent?.detail,
        constraint: error.parent?.constraint,
        table: error.parent?.table
      })

      throw error
    }
    const { id } = await savePaymentRequest(paymentRequest)
    paymentRequestId = id
  })

  test('should save new schedule', async () => {
    await createSchedule(paymentRequestId)
    const schedule = await db.schedule.findOne({ where: { paymentRequestId } })
    expect(schedule).not.toBeNull()
  })

  test('should save schedule with payment request id', async () => {
    await createSchedule(paymentRequestId)
    const schedule = await db.schedule.findOne({ where: { paymentRequestId } })
    expect(schedule.paymentRequestId).toBe(paymentRequestId)
  })

  test('should save schedule as pending', async () => {
    await createSchedule(paymentRequestId)
    const schedule = await db.schedule.findOne({ where: { paymentRequestId } })
    expect(schedule.pending).not.toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
