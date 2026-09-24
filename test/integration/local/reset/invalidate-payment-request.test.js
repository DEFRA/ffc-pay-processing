const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/database')

const { invalidatePaymentRequests } = require('../../../../app/reset/invalidate-payment-requests')

let paymentRequestId

describe('invalidate payment requests', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    const { id } = await savePaymentRequest(paymentRequest, true)
    paymentRequestId = id
  })

  test('should invalidate payment requests', async () => {
    await invalidatePaymentRequests(paymentRequestId)
    const updatedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(updatedPaymentRequest.invalid).toBeTruthy()
  })

  test('should not invalidate payment requests that do not match primary key', async () => {
    await invalidatePaymentRequests(999)
    const updatedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(updatedPaymentRequest.invalid).toBeFalsy()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
