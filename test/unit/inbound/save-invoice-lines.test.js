const db = require('../../../app/data')
const { sanitizeInvoiceLine } = require('../../../app/helpers/sanitize-invoice-line')
const { saveInvoiceLines } = require('../../../app/inbound/save-invoice-lines')

jest.mock('../../../app/data')
jest.mock('../../../app/helpers/sanitize-invoice-line')

describe('saveInvoiceLines', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should delete invoiceLineId before saving', async () => {
    const invoiceLine = { invoiceLineId: 123, description: 'Test', amount: 100 }
    const paymentRequestId = 456
    const transaction = {}

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines([invoiceLine], paymentRequestId, transaction)

    expect(db.invoiceLine.create).toHaveBeenCalledWith(
      { description: 'Test', amount: 100, paymentRequestId: 456 },
      { transaction }
    )
  })

  test('should call sanitizeInvoiceLine on each invoice line', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1', amount: 100 },
      { invoiceLineId: 2, description: 'Item 2', amount: 200 }
    ]
    const paymentRequestId = 456
    const transaction = {}

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines(invoiceLines, paymentRequestId, transaction)

    expect(sanitizeInvoiceLine).toHaveBeenCalledTimes(2)
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(1, invoiceLines[0])
    expect(sanitizeInvoiceLine).toHaveBeenNthCalledWith(2, invoiceLines[1])
  })

  test('should create each invoice line in the database', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1', amount: 100 },
      { invoiceLineId: 2, description: 'Item 2', amount: 200 }
    ]
    const paymentRequestId = 456
    const transaction = {}

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines(invoiceLines, paymentRequestId, transaction)

    expect(db.invoiceLine.create).toHaveBeenCalledTimes(2)
  })

  test('should pass paymentRequestId to all created records', async () => {
    const invoiceLines = [
      { invoiceLineId: 1, description: 'Item 1' },
      { invoiceLineId: 2, description: 'Item 2' }
    ]
    const paymentRequestId = 789
    const transaction = {}

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines(invoiceLines, paymentRequestId, transaction)

    expect(db.invoiceLine.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ paymentRequestId: 789 }),
      { transaction }
    )
    expect(db.invoiceLine.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ paymentRequestId: 789 }),
      { transaction }
    )
  })

  test('should pass transaction to all db.invoiceLine.create calls', async () => {
    const invoiceLines = [{ invoiceLineId: 1, description: 'Item 1' }]
    const paymentRequestId = 456
    const transaction = { id: 'tx123' }

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines(invoiceLines, paymentRequestId, transaction)

    expect(db.invoiceLine.create).toHaveBeenCalledWith(
      expect.any(Object),
      { transaction }
    )
  })

  test('should handle empty invoice lines array', async () => {
    const transaction = {}
    const paymentRequestId = 456

    await saveInvoiceLines([], paymentRequestId, transaction)

    expect(db.invoiceLine.create).not.toHaveBeenCalled()
  })

  test('should throw error if db.invoiceLine.create fails', async () => {
    const invoiceLine = { invoiceLineId: 1, description: 'Item 1' }
    const paymentRequestId = 456
    const transaction = {}

    db.invoiceLine.create.mockRejectedValue(new Error('Database error'))

    await expect(
      saveInvoiceLines([invoiceLine], paymentRequestId, transaction)
    ).rejects.toThrow('Database error')
  })

  test('should preserve other properties of invoice line', async () => {
    const invoiceLine = {
      invoiceLineId: 1,
      description: 'Test',
      amount: 100,
      quantity: 5,
      unitPrice: 20
    }
    const paymentRequestId = 456
    const transaction = {}

    db.invoiceLine.create.mockResolvedValue({})

    await saveInvoiceLines([invoiceLine], paymentRequestId, transaction)

    expect(db.invoiceLine.create).toHaveBeenCalledWith(
      {
        description: 'Test',
        amount: 100,
        quantity: 5,
        unitPrice: 20,
        paymentRequestId: 456
      },
      { transaction }
    )
  })
})
