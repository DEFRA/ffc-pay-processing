jest.mock('../../../../app/processing/enrichment/get-original-settlement-date')
const { getOriginalSettlementDate: mockGetOriginalSettlementDate } = require('../../../../app/processing/enrichment/get-original-settlement-date')

jest.mock('../../../../app/processing/enrichment/get-invoice-correction-reference')
const { getInvoiceCorrectionReference: mockGetInvoiceCorrectionReference } = require('../../../../app/processing/enrichment/get-invoice-correction-reference')

jest.mock('../../../../app/processing/enrichment/get-original-invoice-number')
const { getOriginalInvoiceNumber: mockGetOriginalInvoiceNumber } = require('../../../../app/processing/enrichment/get-original-invoice-number')

const { SETTLEMENT_DATE } = require('../../../mocks/values/settlement-date')
const { INVOICE_NUMBER } = require('../../../mocks/values/invoice-number')

const { AR } = require('../../../../app/constants/ledgers')

const { enrichPaymentRequests } = require('../../../../app/processing/enrichment/enrich-payment-requests')

let paymentRequest
let paymentRequests
let previousPaymentRequests

describe('enrich payment requests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetOriginalSettlementDate.mockReturnValue(SETTLEMENT_DATE)
    mockGetInvoiceCorrectionReference.mockReturnValue(INVOICE_NUMBER)
    mockGetOriginalInvoiceNumber.mockReturnValue(INVOICE_NUMBER)

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
    paymentRequests = [paymentRequest]
    previousPaymentRequests = [paymentRequest]
  })

  test('should not enrich AP payment requests', () => {
    enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(mockGetOriginalSettlementDate).not.toHaveBeenCalled()
    expect(mockGetInvoiceCorrectionReference).not.toHaveBeenCalled()
    expect(mockGetOriginalInvoiceNumber).not.toHaveBeenCalled()
  })

  test('should get original settlement date for AR payment request', () => {
    paymentRequest.ledger = AR
    enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(mockGetOriginalSettlementDate).toHaveBeenCalledWith(previousPaymentRequests)
  })

  test('should update original settlement date for AR payment request', () => {
    paymentRequest.ledger = AR
    const result = enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(result[0].originalSettlementDate).toEqual(SETTLEMENT_DATE)
  })

  test('should get invoice correction reference for AR payment request', () => {
    paymentRequest.ledger = AR
    enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(mockGetInvoiceCorrectionReference).toHaveBeenCalledWith(previousPaymentRequests)
  })

  test('should update invoice correction reference for AR payment request', () => {
    paymentRequest.ledger = AR
    const result = enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(result[0].invoiceCorrectionReference).toEqual(INVOICE_NUMBER)
  })

  test('should get original invoice number for AR payment request', () => {
    paymentRequest.ledger = AR
    enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(mockGetOriginalInvoiceNumber).toHaveBeenCalledWith(previousPaymentRequests)
  })

  test('should update original invoice number for AR payment request', () => {
    paymentRequest.ledger = AR
    const result = enrichPaymentRequests(paymentRequests, previousPaymentRequests)
    expect(result[0].originalInvoiceNumber).toEqual(INVOICE_NUMBER)
  })
})
