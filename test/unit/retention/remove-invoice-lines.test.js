const { removeInvoiceLines } = require('../../../app/retention/remove-invoice-lines')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  invoiceLine: {
    destroy: jest.fn()
  }
}))

describe('removeInvoiceLines', () => {
  const paymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.invoiceLine.destroy with correct parameters', async () => {
    await removeInvoiceLines(paymentRequestIds, transaction)

    expect(db.invoiceLine.destroy).toHaveBeenCalledTimes(1)
    expect(db.invoiceLine.destroy).toHaveBeenCalledWith({
      where: { paymentRequestId: paymentRequestIds },
      transaction
    })
  })

  test('calls db.invoiceLine.destroy with undefined transaction if not provided', async () => {
    await removeInvoiceLines(paymentRequestIds)

    expect(db.invoiceLine.destroy).toHaveBeenCalledWith({
      where: { paymentRequestId: paymentRequestIds },
      transaction: undefined
    })
  })

  test('propagates errors from db.invoiceLine.destroy', async () => {
    const error = new Error('DB failure')
    db.invoiceLine.destroy.mockRejectedValue(error)

    await expect(removeInvoiceLines(paymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
