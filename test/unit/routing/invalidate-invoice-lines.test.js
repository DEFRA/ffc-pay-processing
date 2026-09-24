const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['invoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { invalidateInvoiceLines } = require('../../../app/routing/invalidate-invoice-lines')

describe('invalidateInvoiceLines', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('marks the payment request invoice lines invalid against the transaction', async () => {
    await invalidateInvoiceLines(1, mockDb.trx)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ paymentRequestId: 1 })
    expect(mockDb.builder.update).toHaveBeenCalledWith({ invalid: true })
  })

  test.each([undefined, null])('updates outside a transaction when transaction is %s', async (transaction) => {
    await invalidateInvoiceLines(1, transaction)

    expect(mockDb.tables.invoiceLine).toHaveBeenCalledWith(undefined)
  })
})
