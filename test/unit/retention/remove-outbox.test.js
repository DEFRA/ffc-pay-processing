const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['outbox'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeOutbox } = require('../../../app/retention/remove-outbox')

describe('removeOutbox', () => {
  const completedPaymentRequestIds = [101, 102]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes rows matching the ids against the transaction', async () => {
    await removeOutbox(completedPaymentRequestIds, mockDb.trx)

    expect(mockDb.tables.outbox).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('completedPaymentRequestId', completedPaymentRequestIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await removeOutbox(completedPaymentRequestIds, transaction)

    expect(mockDb.tables.outbox).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('propagates errors from the delete', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(removeOutbox(completedPaymentRequestIds, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
