jest.mock('ffc-pay-schemes', () => ({
  createSplitInvoiceNumber: jest.fn()
}))

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn()
}))

const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { randomUUID } = require('node:crypto')
const { createLedgerSplitPaymentRequest } = require('../../../../../app/processing/delta/assign-ledger/create-ledger-split-payment-request')

describe('createLedgerSplitPaymentRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    createSplitInvoiceNumber.mockReturnValue('SPLIT-INVOICE-B')
    randomUUID.mockReturnValue('reference-id')
  })

  test('creates a ledger split payment request', () => {
    const paymentRequest = {
      originalInvoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      amount: 100,
      nested: {
        value: 'original'
      }
    }
    const ledger = 'ledger-1'

    const result = createLedgerSplitPaymentRequest(paymentRequest, ledger)

    expect(createSplitInvoiceNumber).toHaveBeenCalledWith(
      'ORIGINAL-INVOICE',
      'B',
      6
    )
    expect(randomUUID).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      ...paymentRequest,
      ledger,
      invoiceNumber: 'SPLIT-INVOICE-B',
      referenceId: 'reference-id'
    })
  })

  test('does not mutate the original payment request', () => {
    const paymentRequest = {
      originalInvoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      nested: {
        value: 'original'
      }
    }

    const result = createLedgerSplitPaymentRequest(paymentRequest, 'ledger-1')

    result.nested.value = 'changed'

    expect(paymentRequest).toEqual({
      originalInvoiceNumber: 'ORIGINAL-INVOICE',
      schemeId: 6,
      nested: {
        value: 'original'
      }
    })
  })
})
