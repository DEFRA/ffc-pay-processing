const { removeCompletedInvoiceLines } = require('../../../app/retention/remove-completed-invoice-lines')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  completedInvoiceLine: {
    destroy: jest.fn()
  }
}))

describe('removeCompletedInvoiceLines', () => {
  const completedPaymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.completedInvoiceLine.destroy with correct parameters', async () => {
    await removeCompletedInvoiceLines(completedPaymentRequestIds, transaction)

    expect(db.completedInvoiceLine.destroy).toHaveBeenCalledTimes(1)
    expect(db.completedInvoiceLine.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction
    })
  })

  test('calls db.completedInvoiceLine.destroy with undefined transaction if not provided', async () => {
    await removeCompletedInvoiceLines(completedPaymentRequestIds)

    expect(db.completedInvoiceLine.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction: undefined
    })
  })

  test('propagates errors from db.completedInvoiceLine.destroy', async () => {
    const error = new Error('DB failure')
    db.completedInvoiceLine.destroy.mockRejectedValue(error)

    await expect(removeCompletedInvoiceLines(completedPaymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
