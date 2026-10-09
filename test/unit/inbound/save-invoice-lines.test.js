const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['invoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../../app/helpers/sanitize-invoice-line')
const { sanitizeInvoiceLine } = require('../../../app/helpers/sanitize-invoice-line')

const { saveInvoiceLines } = require('../../../app/inbound/save-invoice-lines')

describe('saveInvoiceLines', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('should delete invoiceLineId before saving', async () => {
    const invoiceLine = { invoiceLineId: 123, description: 'Test', value: 100 }

    await saveInvoiceLines([invoiceLine], 456, mockDb.trx)

    expect(invoiceLine.invoiceLineId).toBeUndefined()
    expect(mockDb.builder.insert).toHaveBeenCalledWith(expect.not.objectContaining({ invoiceLineId: expect.anything() }))
  })

  test('should call sanitizeInvoiceLine on each invoice line', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1', value: 100 },
      { invoiceLineId: 2, description: 'Item 2', value: 200 }
    ]

    await saveInvoiceLines(invoiceLines, 456, mockDb.trx)

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(2)
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(1, invoiceLines[0])
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(2, invoiceLines[1])
  })

  test('should insert each invoice line in the database', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1', value: 100 },
      { invoiceLineId: 2, description: 'Item 2', value: 200 }
    ]

    await saveInvoiceLines(invoiceLines, 456, mockDb.trx)

    expect(mockDb.builder.insert).toHaveBeenCalledTimes(2)
  })

  test('should pass paymentRequestId to all inserted records', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1' },
      { invoiceLineId: 2, description: 'Item 2' }
    ]

    await saveInvoiceLines(invoiceLines, 789, mockDb.trx)

    expect(mockDb.builder.insert).toHaveBeenNthCalledWith(1, expect.objectContaining({ paymentRequestId: 789 }))
    expect(mockDb.builder.insert).toHaveBeenNthCalledWith(2, expect.objectContaining({ paymentRequestId: 789 }))
  })

  test('should run every insert against the transaction', async () => {
    const invoiceLines = [{ invoiceLineId: 1, description: 'Item 1' }, { invoiceLineId: 2, description: 'Item 2' }]

    await saveInvoiceLines(invoiceLines, 456, mockDb.trx)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledTimes(2)
    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(mockDb.trx)
  })

  test('should run outside a transaction if transaction is null', async () => {
    await saveInvoiceLines([{ description: 'Item 1' }], 456, null)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(undefined)
  })

  test('should handle empty invoice lines array', async () => {
    await saveInvoiceLines([], 456, mockDb.trx)

    expect(mockDb.builder.insert).not.toHaveBeenCalled()
  })

  test('should throw error if insert fails', async () => {
    mockDb.builder.rejects(new Error('Database error'))

    await expect(
      saveInvoiceLines([{ invoiceLineId: 1, description: 'Item 1' }], 456, mockDb.trx)
    ).rejects.toThrow('Database error')
  })

  test('should only insert invoice line columns', async () => {
    const invoiceLine = {
      invoiceLineId: 1,
      schemeCode: '80001',
      accountCode: 'SOS273',
      fundCode: 'DRD10',
      agreementNumber: 'SIP00000000001',
      description: 'G00 - Gross value of claim',
      value: 100,
      convergence: false,
      deliveryBody: 'RP00',
      marketingYear: 2022,
      stateAid: false,
      invalid: false,
      quantity: 5,
      unitPrice: 20
    }

    await saveInvoiceLines([invoiceLine], 456, mockDb.trx)

    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      paymentRequestId: 456,
      schemeCode: '80001',
      accountCode: 'SOS273',
      fundCode: 'DRD10',
      agreementNumber: 'SIP00000000001',
      description: 'G00 - Gross value of claim',
      value: 100,
      convergence: false,
      deliveryBody: 'RP00',
      marketingYear: 2022,
      stateAid: false,
      invalid: false
    })
  })
})
