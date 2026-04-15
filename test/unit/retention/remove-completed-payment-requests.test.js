const { removeCompletedPaymentRequests } = require('../../../app/retention/remove-completed-payment-requests')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  completedPaymentRequest: {
    destroy: jest.fn()
  }
}))

describe('removeCompletedPaymentRequests', () => {
  const completedPaymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.completedPaymentRequest.destroy with correct parameters', async () => {
    await removeCompletedPaymentRequests(completedPaymentRequestIds, transaction)

    expect(db.completedPaymentRequest.destroy).toHaveBeenCalledTimes(1)
    expect(db.completedPaymentRequest.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction
    })
  })

  test('calls db.completedPaymentRequest.destroy with undefined transaction if not provided', async () => {
    await removeCompletedPaymentRequests(completedPaymentRequestIds)

    expect(db.completedPaymentRequest.destroy).toHaveBeenCalledWith({
      where: { completedPaymentRequestId: completedPaymentRequestIds },
      transaction: undefined
    })
  })

  test('propagates errors from db.completedPaymentRequest.destroy', async () => {
    const error = new Error('DB failure')
    db.completedPaymentRequest.destroy.mockRejectedValue(error)

    await expect(removeCompletedPaymentRequests(completedPaymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
