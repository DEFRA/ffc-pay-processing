jest.mock('ffc-pay-schemes', () => ({
  createSplitInvoiceNumber: jest.fn()
}))

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn()
}))

const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { randomUUID } = require('node:crypto')
const {
  createSplitPaymentRequest
} = require('../../../../../app/processing/delta/zero-value-split/create-split-payment-request')

describe('createSplitPaymentRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createSplitInvoiceNumber.mockReturnValue('SPLIT-INVOICE')
    randomUUID.mockReturnValue('REFERENCE-ID')
  })

  test('creates a split payment request', () => {
    const paymentRequest = {
      invoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      value: 100,
      invoiceLines: [{ value: 100 }]
    }

    const result = createSplitPaymentRequest(
      paymentRequest,
      'AP',
      'A'
    )

    expect(createSplitInvoiceNumber).toHaveBeenCalledWith(
      'ORIGINAL-INVOICE',
      'A',
      6
    )
    expect(randomUUID).toHaveBeenCalledTimes(1)

    expect(result).toEqual({
      ...paymentRequest,
      ledger: 'AP',
      originalInvoiceNumber: 'ORIGINAL-INVOICE',
      invoiceNumber: 'SPLIT-INVOICE',
      invoiceLines: [],
      referenceId: 'REFERENCE-ID'
    })
  })

  test('preserves the original payment request', () => {
    const paymentRequest = {
      invoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      value: 100,
      invoiceLines: [{ value: 100 }]
    }

    const result = createSplitPaymentRequest(paymentRequest, 'BPS', 'B')

    expect(paymentRequest).toEqual({
      invoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      value: 100,
      invoiceLines: [{ value: 100 }]
    })
    expect(result.invoiceLines).not.toBe(paymentRequest.invoiceLines)
  })
})
