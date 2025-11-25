const { getOriginalInvoiceNumber } = require('../../../../app/processing/enrichment/get-original-invoice-number')

let paymentRequest
let paymentRequests

describe('get original invoice number', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    paymentRequests = [paymentRequest]
  })

  test('should return undefined if no previous payment requests', () => {
    expect(getOriginalInvoiceNumber([])).toBeUndefined()
  })

  test('should return invoice number if only payment request is first payment', () => {
    expect(getOriginalInvoiceNumber(paymentRequests)).toEqual(paymentRequest.invoiceNumber)
  })

  test('should return invoice number of payment request one if multiple payment requests', () => {
    paymentRequests.push(structuredClone(paymentRequest))
    paymentRequests[1].paymentRequestNumber = 2
    paymentRequests[1].invoiceNumber = '1234'
    expect(getOriginalInvoiceNumber(paymentRequests)).toEqual(paymentRequest.invoiceNumber)
  })

  test('should return invoice number of first payment request if no first payment', () => {
    paymentRequests.push(structuredClone(paymentRequest))
    paymentRequests[0].paymentRequestNumber = 2
    paymentRequests[1].paymentRequestNumber = 3
    paymentRequests[1].invoiceNumber = '1234'
    expect(getOriginalInvoiceNumber(paymentRequests)).toEqual(paymentRequest.invoiceNumber)
  })
})
