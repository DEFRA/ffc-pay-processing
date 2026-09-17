jest.mock('ffc-pay-schemes', () => ({
  createSplitInvoiceNumber: jest.fn()
}))

jest.mock('../../../../../app/processing/delta/assign-ledger/ensure-value-consistency', () => ({
  ensureValueConsistency: jest.fn()
}))

jest.mock('../../../../../app/processing/delta/assign-ledger/calculate-invoice-line-values', () => ({
  calculateInvoiceLineValues: jest.fn()
}))

jest.mock('../../../../../app/processing/delta/assign-ledger/create-ledger-split-payment-request', () => ({
  createLedgerSplitPaymentRequest: jest.fn()
}))

const { createSplitInvoiceNumber } = require('ffc-pay-schemes')
const { ensureValueConsistency } = require('../../../../../app/processing/delta/assign-ledger/ensure-value-consistency')
const { calculateInvoiceLineValues } = require('../../../../../app/processing/delta/assign-ledger/calculate-invoice-line-values')
const { createLedgerSplitPaymentRequest } = require('../../../../../app/processing/delta/assign-ledger/create-ledger-split-payment-request')
const { splitToLedger } = require('../../../../../app/processing/delta/assign-ledger/split-to-ledger')
const { AP } = require('../../../../../app/constants/ledgers')

describe('splitToLedger', () => {
  let paymentRequest
  let splitPaymentRequest
  let consoleLog

  beforeEach(() => {
    jest.clearAllMocks()

    consoleLog = jest.spyOn(console, 'log').mockImplementation()

    paymentRequest = {
      invoiceNumber: 'INV-123',
      schemeId: 1,
      value: 100,
      invoiceLines: [{ value: 100 }]
    }

    splitPaymentRequest = {
      invoiceLines: [{ value: 100 }]
    }

    createSplitInvoiceNumber.mockReturnValue('INV-123-A')
    createLedgerSplitPaymentRequest.mockReturnValue(splitPaymentRequest)
  })

  afterEach(() => {
    consoleLog.mockRestore()
  })

  test('splits a payment request to AP', () => {
    const result = splitToLedger(paymentRequest, 25, AP)

    expect(consoleLog).toHaveBeenCalledWith(
      'Performing ledger split for INV-123'
    )

    expect(createSplitInvoiceNumber).toHaveBeenCalledWith(
      'INV-123',
      'A',
      1
    )

    expect(createLedgerSplitPaymentRequest).toHaveBeenCalledWith(
      paymentRequest,
      AP
    )

    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      1,
      paymentRequest.invoiceLines,
      0.75
    )
    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      2,
      splitPaymentRequest.invoiceLines,
      0.25
    )

    expect(paymentRequest).toMatchObject({
      originalInvoiceNumber: 'INV-123',
      invoiceNumber: 'INV-123-A',
      value: 125
    })

    expect(splitPaymentRequest.value).toBe(-25)

    expect(ensureValueConsistency).toHaveBeenNthCalledWith(
      1,
      paymentRequest
    )
    expect(ensureValueConsistency).toHaveBeenNthCalledWith(
      2,
      splitPaymentRequest
    )

    expect(result).toEqual([paymentRequest, splitPaymentRequest])
  })

  test('splits a payment request to a non-AP ledger', () => {
    const ledger = 'AR'

    const result = splitToLedger(paymentRequest, 25, ledger)

    expect(createLedgerSplitPaymentRequest).toHaveBeenCalledWith(
      paymentRequest,
      ledger
    )

    expect(paymentRequest.value).toBe(75)
    expect(splitPaymentRequest.value).toBe(25)

    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      1,
      paymentRequest.invoiceLines,
      0.75
    )
    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      2,
      splitPaymentRequest.invoiceLines,
      0.25
    )

    expect(result).toEqual([paymentRequest, splitPaymentRequest])
  })

  test('uses absolute values when calculating apportionment percentages', () => {
    paymentRequest.value = -100

    splitToLedger(paymentRequest, -25, AP)

    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      1,
      paymentRequest.invoiceLines,
      0.75
    )
    expect(calculateInvoiceLineValues).toHaveBeenNthCalledWith(
      2,
      splitPaymentRequest.invoiceLines,
      0.25
    )
  })
})
