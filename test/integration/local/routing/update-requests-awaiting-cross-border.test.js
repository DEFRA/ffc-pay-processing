const db = require('../../../../app/database')

jest.mock('../../../../app/auto-hold')
const { removeAutoHold: mockRemoveAutoHold } = require('../../../../app/auto-hold')

const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const { CROSS_BORDER } = require('../../../../app/constants/hold-categories-names')

const { updateRequestsAwaitingCrossBorder } = require('../../../../app/routing/update-requests-awaiting-cross-border')

let paymentRequest

describe('update requests awaiting cross border', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
  })

  test('should update delivery body and value from cross border payment request', async () => {
    await savePaymentRequest(paymentRequest)
    paymentRequest.deliveryBody = 'XB00'
    paymentRequest.value = 5000
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const updatedPaymentRequest = await db.paymentRequest().where({ invoiceNumber: paymentRequest.invoiceNumber }).first()
    expect(updatedPaymentRequest.deliveryBody).toBe('XB00')
    expect(updatedPaymentRequest.value).toBe(5000)
  })

  test('should invalidate invoice lines from cross border payment request', async () => {
    const { id } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const updatedInvoiceLines = await db.invoiceLine().where({ paymentRequestId: id }).orderBy('invoiceLineId', 'asc')
    expect(updatedInvoiceLines[0].invalid).toBe(true)
  })

  test('should add new valid invoice lines from cross border payment request', async () => {
    const { id } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const updatedInvoiceLines = await db.invoiceLine().where({ paymentRequestId: id }).orderBy('invoiceLineId', 'asc')
    expect(updatedInvoiceLines[1].invalid).toBe(false)
  })

  test('should not save invoice lines or remove hold if no matching payment request', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const invoiceLines = await db.invoiceLine()
    expect(invoiceLines.length).toBe(0)
    expect(mockRemoveAutoHold).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(new Error(`No payment request matching Cross Border invoice number: ${paymentRequest.invoiceNumber}`))
    consoleSpy.mockRestore()
  })

  test('should remove cross border hold from cross border payment request', async () => {
    await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    expect(mockRemoveAutoHold).toHaveBeenCalledWith(paymentRequest, CROSS_BORDER)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
