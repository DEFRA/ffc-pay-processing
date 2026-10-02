const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['holdCategory'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { addHoldType } = require('../../../app/holds')

describe('addHoldType', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('inserts name and schemeId into hold categories against the transaction', async () => {
    const name = 'Test Hold'
    const schemeId = 123
    await addHoldType(name, schemeId, mockDb.trx)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.insert).toHaveBeenCalledWith({ name, schemeId })
  })

  test.each([undefined, null])('inserts outside a transaction when transaction is %s', async (transaction) => {
    await addHoldType('Test Hold', 123, transaction)
    expect(mockDb.tables.holdCategory).toHaveBeenCalledWith(undefined)
  })
})
