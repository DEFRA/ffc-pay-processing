const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/data')

const { acknowledgePaymentRequest } = require('../../../../app/acknowledgement/acknowledge-payment-request')

describe('acknowledge payment request', () => {
  beforeEach(async () => {
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
  })

  test('should acknowledge payment request if matching invoice number', async () => {
    await acknowledgePaymentRequest(paymentRequest.invoiceNumber, TIMESTAMP)
    const acknowledgedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(acknowledgedPaymentRequest.acknowledged).toEqual(TIMESTAMP)
  })

  test('should not acknowledge payment request if not matching invoice number', async () => {
    await acknowledgePaymentRequest('not matching invoice number', TIMESTAMP)
    const acknowledgedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(acknowledgedPaymentRequest.acknowledged).toEqual(null)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
