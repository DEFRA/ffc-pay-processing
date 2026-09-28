const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

jest.mock('../../../../app/event')
const { sendResetEvent: mockSendResetEvent } = require('../../../../app/event')

jest.mock('../../../../app/reset/reset-reference-id')
const { resetReferenceId: mockResetReferenceId } = require('../../../../app/reset/reset-reference-id')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const { resetPaymentRequestByInvoiceNumber } = require('../../../../app/reset/reset-payment-requests-invoice-number')

describe('reset payment requests by invoice number', () => {
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
  })

  test('should reset payment requests if matched by invoice number and payment has completed processing', async () => {
    await savePaymentRequest(paymentRequest, true)
    await resetPaymentRequestByInvoiceNumber(paymentRequest.invoiceNumber)
    expect(mockResetReferenceId).toHaveBeenCalled()
  })

  test('should throw error if matched by invoice number but payment has not completed processing', async () => {
    await savePaymentRequest(paymentRequest, false)
    await expect(resetPaymentRequestByInvoiceNumber(paymentRequest.invoiceNumber)).rejects.toThrow(`Payment request ${paymentRequest.invoiceNumber} has not completed processing so cannot be reset`)
  })

  test('should throw error if not matched by invoice number', async () => {
    await savePaymentRequest(paymentRequest, true)
    await expect(resetPaymentRequestByInvoiceNumber('999')).rejects.toThrow('Payment request 999 does not exist')
  })

  test('should send reset event if matched by invoice number and payment has completed processing', async () => {
    await savePaymentRequest(paymentRequest, true)
    await resetPaymentRequestByInvoiceNumber(paymentRequest.invoiceNumber)
    expect(mockSendResetEvent).toHaveBeenCalled()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
