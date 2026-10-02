const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['schedule'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeSchedules } = require('../../../app/retention/remove-schedules')

describe('removeSchedules', () => {
  const paymentRequestIds = [1, 2, 3]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes rows matching the ids against the transaction', async () => {
    await removeSchedules(paymentRequestIds, mockDb.trx)

    expect(mockDb.tables.schedule).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('paymentRequestId', paymentRequestIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await removeSchedules(paymentRequestIds, transaction)

    expect(mockDb.tables.schedule).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('propagates errors from the delete', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(removeSchedules(paymentRequestIds, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
