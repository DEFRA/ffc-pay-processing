const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const db = require('../../../../app/database')
const { pickColumns } = require('../../../helpers/table-columns')

const { saveInvoiceLines } = require('../../../../app/inbound/save-invoice-lines')

let paymentRequestId

describe('save invoice lines', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    const [savedPaymentRequest] = await db.paymentRequest().insert(pickColumns('paymentRequest', paymentRequest)).returning('paymentRequestId')
    paymentRequestId = savedPaymentRequest.paymentRequestId
  })

  test('should save all invoice lines', async () => {
    await saveInvoiceLines(paymentRequest.invoiceLines, paymentRequestId)
    const invoiceLines = await db.invoiceLine().where({ paymentRequestId })
    expect(invoiceLines.length).toBe(paymentRequest.invoiceLines.length)
  })

  test('should save invoice line with payment request id', async () => {
    await saveInvoiceLines(paymentRequest.invoiceLines, paymentRequestId)
    const invoiceLines = await db.invoiceLine().where({ paymentRequestId })
    expect(invoiceLines[0].paymentRequestId).toBe(paymentRequestId)
  })

  test('should overwrite existing payment request id if line has existing payment request id', async () => {
    const invoiceLines = paymentRequest.invoiceLines.map(invoiceLine => ({ ...invoiceLine, paymentRequestId: 999 }))
    await saveInvoiceLines(invoiceLines, paymentRequestId)
    const savedInvoiceLines = await db.invoiceLine().where({ paymentRequestId })
    expect(savedInvoiceLines[0].paymentRequestId).toBe(paymentRequestId)
  })

  test('should overwrite existing invoice line id if line has existing invoice line id', async () => {
    const invoiceLines = paymentRequest.invoiceLines.map(invoiceLine => ({ ...invoiceLine, invoiceLineId: 'abc' }))
    await saveInvoiceLines(invoiceLines, paymentRequestId)
    const savedInvoiceLines = await db.invoiceLine().where({ paymentRequestId })
    expect(savedInvoiceLines[0].invoiceLineId).not.toBe('abc')
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
