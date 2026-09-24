const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/database')

const { updatePendingPaymentRequests } = require('../../../../app/outbound/update-pending-payment-requests')

let paymentRequests

describe('get pending payment requests', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await savePaymentRequest(paymentRequest, true)
    paymentRequests = await db.completedPaymentRequest()
  })

  test('should update pending payment requests as submitted', async () => {
    await updatePendingPaymentRequests(paymentRequests, TIMESTAMP)
    const updatedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(updatedPaymentRequest.submitted).toEqual(TIMESTAMP)
  })

  test('should not update payment requests that do not match primary key', async () => {
    paymentRequests[0].completedPaymentRequestId = 999
    await updatePendingPaymentRequests(paymentRequests, TIMESTAMP)
    const updatedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(updatedPaymentRequest.submitted).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
