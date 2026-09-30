const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const { getPaymentRequest } = require('../../../../app/acknowledgement/get-payment-request')

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

  test('should get payment request if matching invoice number', async () => {
    const matchedPaymentRequest = await getPaymentRequest(paymentRequest.invoiceNumber)
    expect(matchedPaymentRequest.invoiceNumber).toEqual(paymentRequest.invoiceNumber)
  })

  test('should not get payment request if not matching invoice number', async () => {
    const matchedPaymentRequest = await getPaymentRequest('not matching invoice number')
    expect(matchedPaymentRequest).toEqual(null)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
