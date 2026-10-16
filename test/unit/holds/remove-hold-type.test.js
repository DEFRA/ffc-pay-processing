const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['holdCategory'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeHoldType } = require('../../../app/holds')

describe('removeHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes where holdCategoryId matches against the transaction', async () => {
    const holdCategoryId = 9
    await removeHoldType(holdCategoryId, mockDb.trx)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ holdCategoryId })
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('deletes outside a transaction when transaction is %s', async (transaction) => {
    await removeHoldType(9, transaction)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(undefined)
  })
})
