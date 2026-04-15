const { removeOutbox } = require('../../../app/retention/remove-outbox')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  outbox: {
    destroy: jest.fn()
  }
}))

describe('removeOutbox', () => {
  const completedPaymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.outbox.destroy with correct parameters', async () => {
    await removeOutbox(completedPaymentRequestIds, transaction)

    expect(db.outbox.destroy).toHaveBeenCalledTimes(1)
    expect(db.outbox.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction
    })
  })

  test('calls db.outbox.destroy with undefined transaction if not provided', async () => {
    await removeOutbox(completedPaymentRequestIds)

    expect(db.outbox.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction: undefined
    })
  })

  test('propagates errors from db.outbox.destroy', async () => {
    const error = new Error('DB failure')
    db.outbox.destroy.mockRejectedValue(error)

    await expect(removeOutbox(completedPaymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
