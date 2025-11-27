const { getDefaultAgreementNumber } = require('../../../../app/processing/delta/get-default-agreement-number')

const agreementNumber = 'previous-agreement-number'

let paymentRequest
let previousPaymentRequests

describe('get default agreement number', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    previousPaymentRequests = [{ ...structuredClone(paymentRequest), agreementNumber }]
  })

  test('should return current agreement number if no previous payment requests', () => {
    const result = getDefaultAgreementNumber(paymentRequest, [])
    expect(result).toEqual(paymentRequest.agreementNumber)
  })

  test('should return first agreement number if one previous payment requests', () => {
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(agreementNumber)
  })

  test('should return first agreement number if multiple previous payment requests', () => {
    previousPaymentRequests.push({ ...structuredClone(paymentRequest), agreementNumber: 'another-agreement-number' })
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(agreementNumber)
  })

  test('should return first agreement number if multiple previous payment requests with no agreement number', () => {
    previousPaymentRequests[0].agreementNumber = null
    previousPaymentRequests.push({ ...structuredClone(paymentRequest), agreementNumber })
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(agreementNumber)
  })

  test('should return first agreement number from invoice lines if no previous agreement number', () => {
    previousPaymentRequests[0].agreementNumber = null
    previousPaymentRequests.push({ ...structuredClone(paymentRequest), agreementNumber: null })
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(paymentRequest.invoiceLines[0].agreementNumber)
  })

  test('should return first agreement number from invoice lines if no previous agreement number and no agreement number on first invoice line', () => {
    previousPaymentRequests[0].agreementNumber = null
    previousPaymentRequests.push({ ...structuredClone(paymentRequest), agreementNumber: null })
    previousPaymentRequests[0].invoiceLines[0].agreementNumber = null
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(previousPaymentRequests[1].invoiceLines[0].agreementNumber)
  })

  test('should return current agreement number if no previous agreement number and no agreement number on any invoice lines', () => {
    previousPaymentRequests[0].agreementNumber = null
    previousPaymentRequests.push({ ...paymentRequest, agreementNumber: null })
    previousPaymentRequests[0].invoiceLines[0].agreementNumber = null
    previousPaymentRequests[1].invoiceLines[0].agreementNumber = null
    const result = getDefaultAgreementNumber(paymentRequest, previousPaymentRequests)
    expect(result).toEqual(paymentRequest.agreementNumber)
  })
})
