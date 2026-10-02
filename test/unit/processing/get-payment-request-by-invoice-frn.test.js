const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['completedPaymentRequest', 'completedInvoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getPaymentRequestByInvoiceAndFrn } = require('../../../app/processing/get-payment-request-by-invoice-frn')

const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')
const { FRN } = require('../../mocks/values/frn')

describe('getPaymentRequestByInvoiceAndFrn', () => {
  let paymentRequestBuilder
  let invoiceLineBuilder

  beforeEach(() => {
    jest.clearAllMocks()
    paymentRequestBuilder = createQueryBuilder().resolves(undefined)
    invoiceLineBuilder = createQueryBuilder().resolves([])
    mockDb.tables.completedPaymentRequest.mockReturnValue(paymentRequestBuilder)
    mockDb.tables.completedInvoiceLine.mockReturnValue(invoiceLineBuilder)
  })

  test('should query by invoiceNumber and frn', async () => {
    await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)
    expect(paymentRequestBuilder.where).toHaveBeenCalledWith({ invoiceNumber: INVOICE_NUMBER, frn: FRN })
    expect(paymentRequestBuilder.first).toHaveBeenCalledTimes(1)
  })

  test('should return undefined and not query invoice lines if no match', async () => {
    const result = await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)
    expect(result).toBeUndefined()
    expect(mockDb.tables.completedInvoiceLine).not.toHaveBeenCalled()
  })

  test('should return the payment request with its invoice lines', async () => {
    const paymentRequest = { completedPaymentRequestId: 1, invoiceNumber: INVOICE_NUMBER, frn: FRN }
    const invoiceLines = [{ completedInvoiceLineId: 1, completedPaymentRequestId: 1, value: 100 }]
    paymentRequestBuilder.resolves(paymentRequest)
    invoiceLineBuilder.resolves(invoiceLines)

    const result = await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)

    expect(invoiceLineBuilder.where).toHaveBeenCalledWith({ completedPaymentRequestId: 1 })
    expect(invoiceLineBuilder.orderBy).toHaveBeenCalledWith('completedInvoiceLineId', 'asc')
    expect(result).toEqual({ ...paymentRequest, invoiceLines })
  })
})
