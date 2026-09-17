const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/data')

const { updatePendingPaymentRequests } = require('../../../../app/outbound/update-pending-payment-requests')

let paymentRequests

describe('get pending payment requests', () => {
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
    await savePaymentRequest(paymentRequest, true)
    paymentRequests = await db.completedPaymentRequest.findAll({ raw: true })
  })

  test('should update pending payment requests as submitted', async () => {
    await updatePendingPaymentRequests(paymentRequests, TIMESTAMP)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.submitted).toEqual(TIMESTAMP)
  })

  test('should not update payment requests that do not match primary key', async () => {
    paymentRequests[0].completedPaymentRequestId = 999
    await updatePendingPaymentRequests(paymentRequests, TIMESTAMP)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.submitted).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
