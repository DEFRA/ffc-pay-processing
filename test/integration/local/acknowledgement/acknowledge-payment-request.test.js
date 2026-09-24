const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/database')

const { acknowledgePaymentRequest } = require('../../../../app/acknowledgement/acknowledge-payment-request')

describe('acknowledge payment request', () => {
  beforeEach(async () => {
    await resetDatabase()
    await savePaymentRequest(paymentRequest, true)
  })

  test('should acknowledge payment request if matching invoice number', async () => {
    await acknowledgePaymentRequest(paymentRequest.invoiceNumber, TIMESTAMP)
    const acknowledgedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(acknowledgedPaymentRequest.acknowledged).toEqual(TIMESTAMP)
  })

  test('should not acknowledge payment request if not matching invoice number', async () => {
    await acknowledgePaymentRequest('not matching invoice number', TIMESTAMP)
    const acknowledgedPaymentRequest = await db.completedPaymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(acknowledgedPaymentRequest.acknowledged).toEqual(null)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
