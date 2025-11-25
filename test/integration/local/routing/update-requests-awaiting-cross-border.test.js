const db = require('../../../../app/data')

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
    const updatedPaymentRequest = await db.paymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.deliveryBody).toBe('XB00')
    expect(updatedPaymentRequest.value).toBe(5000)
  })

  test('should invalidate invoice lines from cross border payment request', async () => {
    const { id } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const updatedInvoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId: id } })
    expect(updatedInvoiceLines[0].invalid).toBe(true)
  })

  test('should add new valid invoice lines from cross border payment request', async () => {
    const { id } = await savePaymentRequest(paymentRequest)
    await updateRequestsAwaitingCrossBorder(paymentRequest)
    const updatedInvoiceLines = await db.invoiceLine.findAll({ where: { paymentRequestId: id } })
    expect(updatedInvoiceLines[1].invalid).toBe(false)
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
