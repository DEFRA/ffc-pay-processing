const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const { getExistingPaymentRequest } = require('../../../../app/inbound/get-existing-payment-request')

describe('get existing payment request', () => {
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
    await savePaymentRequest(paymentRequest)
  })

  test('should return payment request if invoice number exists', async () => {
    const paymentRequestResult = await getExistingPaymentRequest(paymentRequest.invoiceNumber)
    expect(paymentRequestResult.invoiceNumber).toBe(paymentRequest.invoiceNumber)
  })

  test('should return null if invoice number does not exist', async () => {
    const paymentRequestResult = await getExistingPaymentRequest('999')
    expect(paymentRequestResult).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
