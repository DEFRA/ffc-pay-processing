const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['frnAgreementClosed'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeFRNAgreementClosed } = require('../../../app/retention/remove-frn-agreement-closed')

describe('removeFRNAgreementClosed', () => {
  const agreementNumber = 'AGR123'
  const frn = 456789
  const schemeId = 10

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes matching closures against the transaction', async () => {
    await removeFRNAgreementClosed(agreementNumber, frn, schemeId, mockDb.trx)

    expect(mockDb.tables.frnAgreementClosed).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ agreementNumber, frn, schemeId })
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await removeFRNAgreementClosed(agreementNumber, frn, schemeId, transaction)

    expect(mockDb.tables.frnAgreementClosed).toHaveBeenCalledWith(undefined)
  })

  test('propagates errors from the delete', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(removeFRNAgreementClosed(agreementNumber, frn, schemeId, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
