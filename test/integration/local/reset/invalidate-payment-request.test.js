const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/data')

const { invalidatePaymentRequests } = require('../../../../app/reset/invalidate-payment-requests')

let paymentRequestId

describe('invalidate payment requests', () => {
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
    const { id } = await savePaymentRequest(paymentRequest, true)
    paymentRequestId = id
  })

  test('should invalidate payment requests', async () => {
    await invalidatePaymentRequests(paymentRequestId)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.invalid).toBeTruthy()
  })

  test('should not invalidate payment requests that do not match primary key', async () => {
    await invalidatePaymentRequests(999)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.invalid).toBeFalsy()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
