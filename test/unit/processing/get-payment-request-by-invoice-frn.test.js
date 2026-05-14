jest.mock('../../../app/data', () => ({
  completedPaymentRequest: {
    findOne: jest.fn()
  },
  completedInvoiceLine: {}
}))

const db = require('../../../app/data')

const { getPaymentRequestByInvoiceAndFrn } = require('../../../app/processing/get-payment-request-by-invoice-frn')

const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')
const { FRN } = require('../../mocks/values/frn')

describe('getPaymentRequestByInvoiceAndFrn', () => {
  beforeEach(() => {
    db.completedPaymentRequest.findOne.mockResolvedValue(null)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should query by invoiceNumber and frn', async () => {
    await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)
    expect(db.completedPaymentRequest.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { invoiceNumber: INVOICE_NUMBER, frn: FRN }
      })
    )
  })

  test('should include invoice lines in query', async () => {
    await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)
    expect(db.completedPaymentRequest.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        include: [{ model: db.completedInvoiceLine, as: 'invoiceLines' }]
      })
    )
  })

  test('should return the result of the query', async () => {
    const paymentRequest = structuredClone(require('../../mocks/payment-requests/payment-request'))
    db.completedPaymentRequest.findOne.mockResolvedValue(paymentRequest)
    const result = await getPaymentRequestByInvoiceAndFrn(INVOICE_NUMBER, FRN)
    expect(result).toEqual(paymentRequest)
  })
})
