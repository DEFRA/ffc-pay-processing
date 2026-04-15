const { removeSchedules } = require('../../../app/retention/remove-schedules')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  schedule: {
    destroy: jest.fn()
  }
}))

describe('removeSchedules', () => {
  const paymentRequestIds = [101, 102]
  const transaction = { id: 'transaction-object' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('calls db.schedule.destroy with correct parameters', async () => {
    await removeSchedules(paymentRequestIds, transaction)

    expect(db.schedule.destroy).toHaveBeenCalledTimes(1)
    expect(db.schedule.destroy).toHaveBeenCalledWith({
      where: { paymentRequestId: paymentRequestIds },
      transaction
    })
  })

  test('calls db.schedule.destroy with undefined transaction if not provided', async () => {
    await removeSchedules(paymentRequestIds)

    expect(db.schedule.destroy).toHaveBeenCalledWith({
      where: { paymentRequestId: paymentRequestIds },
      transaction: undefined
    })
  })

  test('propagates errors from db.schedule.destroy', async () => {
    const error = new Error('DB failure')
    db.schedule.destroy.mockRejectedValue(error)

    await expect(removeSchedules(paymentRequestIds, transaction)).rejects.toThrow('DB failure')
  })
})
