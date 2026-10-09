const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['invoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeInvoiceLines } = require('../../../app/retention/remove-invoice-lines')

describe('removeInvoiceLines', () => {
  const paymentRequestIds = [1, 2, 3]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes rows matching the ids against the transaction', async () => {
    await removeInvoiceLines(paymentRequestIds, mockDb.trx)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('paymentRequestId', paymentRequestIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await removeInvoiceLines(paymentRequestIds, transaction)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('propagates errors from the delete', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(removeInvoiceLines(paymentRequestIds, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
