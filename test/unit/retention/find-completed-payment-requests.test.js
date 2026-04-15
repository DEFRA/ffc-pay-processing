const { findCompletedPaymentRequests } = require('../../../app/retention/find-completed-payment-requests')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  completedPaymentRequest: {
    findAll: jest.fn()
  }
}))

describe('findCompletedPaymentRequests', () => {
  const paymentRequestIds = [1, 2, 3]
  const mockTransaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.completedPaymentRequest.findAll with correct parameters', async () => {
    const mockResult = [
      { completedPaymentRequestId: 101 },
      { completedPaymentRequestId: 102 }
    ]
    db.completedPaymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findCompletedPaymentRequests(paymentRequestIds, mockTransaction)

    expect(db.completedPaymentRequest.findAll).toHaveBeenCalledTimes(1)
    expect(db.completedPaymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['completedPaymentRequestId'],
      where: { paymentRequestId: paymentRequestIds },
      transaction: mockTransaction
    })
    expect(result).toBe(mockResult)
  })

  test('passes undefined transaction if not provided', async () => {
    const mockResult = []
    db.completedPaymentRequest.findAll.mockResolvedValue(mockResult)

    const result = await findCompletedPaymentRequests(paymentRequestIds)

    expect(db.completedPaymentRequest.findAll).toHaveBeenCalledWith({
      attributes: ['completedPaymentRequestId'],
      where: { paymentRequestId: paymentRequestIds },
      transaction: undefined
    })
    expect(result).toBe(mockResult)
  })

  test('propagates errors from db.completedPaymentRequest.findAll', async () => {
    const error = new Error('DB failure')
    db.completedPaymentRequest.findAll.mockRejectedValue(error)

    await expect(findCompletedPaymentRequests(paymentRequestIds, mockTransaction)).rejects.toThrow('DB failure')
  })
})
