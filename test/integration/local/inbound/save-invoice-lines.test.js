const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/data')

const { saveInvoiceLines } = require('../../../../app/inbound/save-invoice-lines')

let paymentRequestId

describe('save invoice lines', () => {
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
    const savedPaymentRequest = await db.paymentRequest.create(paymentRequest)
    paymentRequestId = savedPaymentRequest.paymentRequestId
  })

  test('should save all invoice lines', async () => {
    await saveInvoiceLines(paymentRequest.invoiceLines, paymentRequestId)
    const invoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId } })
    expect(invoiceLines.length).toBe(paymentRequest.invoiceLines.length)
  })

  test('should save invoice line with payment request id', async () => {
    await saveInvoiceLines(paymentRequest.invoiceLines, paymentRequestId)
    const invoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId } })
    expect(invoiceLines[0].paymentRequestId).toBe(paymentRequestId)
  })

  test('should overwrite existing payment request id if line has existing payment request id', async () => {
    const invoiceLines = paymentRequest.invoiceLines.map(invoiceLine => ({ ...invoiceLine, paymentRequestId: 999 }))
    await saveInvoiceLines(invoiceLines, paymentRequestId)
    const savedInvoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId } })
    expect(savedInvoiceLines[0].paymentRequestId).toBe(paymentRequestId)
  })

  test('should overwrite existing invoice line id if line has existing invoice line id', async () => {
    const invoiceLines = paymentRequest.invoiceLines.map(invoiceLine => ({ ...invoiceLine, invoiceLineId: 'abc' }))
    await saveInvoiceLines(invoiceLines, paymentRequestId)
    const savedInvoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId } })
    expect(savedInvoiceLines[0].invoiceLineId).not.toBe('abc')
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
