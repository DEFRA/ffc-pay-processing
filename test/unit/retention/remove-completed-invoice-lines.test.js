const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['completedInvoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { removeCompletedInvoiceLines } = require('../../../app/retention/remove-completed-invoice-lines')

describe('removeCompletedInvoiceLines', () => {
  const completedPaymentRequestIds = [101, 102]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('deletes rows matching the ids against the transaction', async () => {
    await removeCompletedInvoiceLines(completedPaymentRequestIds, mockDb.trx)

    expect(mockDb.tables.completedInvoiceLine).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('completedPaymentRequestId', completedPaymentRequestIds)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await removeCompletedInvoiceLines(completedPaymentRequestIds, transaction)

    expect(mockDb.tables.completedInvoiceLine).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.del).toHaveBeenCalledTimes(1)
  })

  test('propagates errors from the delete', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(removeCompletedInvoiceLines(completedPaymentRequestIds, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
