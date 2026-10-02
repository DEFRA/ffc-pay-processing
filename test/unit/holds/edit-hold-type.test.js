const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['holdCategory'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { editHoldType } = require('../../../app/holds')

describe('editHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('updates name where holdCategoryId matches against the transaction', async () => {
    const name = 'Updated Hold'
    const holdCategoryId = 7
    await editHoldType(name, holdCategoryId, mockDb.trx)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ holdCategoryId })
    expect(mockDb.builder.update).toHaveBeenCalledWith({ name })
  })

  test.each([undefined, null])('updates outside a transaction when transaction is %s', async (transaction) => {
    await editHoldType('Updated Hold', 7, transaction)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(undefined)
  })
})
