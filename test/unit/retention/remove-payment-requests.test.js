const { removePaymentRequests } = require('../../../app/retention/remove-payment-requests')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  Sequelize: {
    Op: {
      in: 'IN_OPERATOR'
    }
  },
  paymentRequest: {
    destroy: jest.fn()
  }
}))

describe('removePaymentRequests', () => {
  const paymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.paymentRequest.destroy with correct parameters', async () => {
    await removePaymentRequests(paymentRequestIds, transaction)

    expect(db.paymentRequest.destroy).toHaveBeenCalledTimes(1)
    expect(db.paymentRequest.destroy).toHaveBeenCalledWith({
      where: {
        paymentRequestId: { [db.Sequelize.Op.in]: paymentRequestIds }
      },
      transaction
    })
  })

  test('calls db.paymentRequest.destroy with undefined transaction if not provided', async () => {
    await removePaymentRequests(paymentRequestIds)

    expect(db.paymentRequest.destroy).toHaveBeenCalledWith({
      where: {
        paymentRequestId: { [db.Sequelize.Op.in]: paymentRequestIds }
      },
      transaction: undefined
    })
  })

  test('propagates errors from db.paymentRequest.destroy', async () => {
    const error = new Error('DB failure')
    db.paymentRequest.destroy.mockRejectedValue(error)

    await expect(removePaymentRequests(paymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
