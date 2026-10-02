const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['completedPaymentRequest'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { findCompletedPaymentRequests } = require('../../../app/retention/find-completed-payment-requests')

describe('findCompletedPaymentRequests', () => {
  const paymentRequestIds = [1, 2, 3]

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([])
  })

  test('selects completed payment request ids for the payment requests', async () => {
    const mockResult = [{ completedPaymentRequestId: 101 }, { completedPaymentRequestId: 102 }]
    mockDb.builder.resolves(mockResult)

    const result = await findCompletedPaymentRequests(paymentRequestIds, mockDb.trx)

    expect(mockDb.tables.completedPaymentRequest).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.select).toHaveBeenCalledWith('completedPaymentRequestId')
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('paymentRequestId', paymentRequestIds)
    expect(result).toEqual(mockResult)
  })

  test.each([undefined, null])('runs outside a transaction when transaction is %s', async (transaction) => {
    await findCompletedPaymentRequests(paymentRequestIds, transaction)

    expect(mockDb.tables.completedPaymentRequest).toHaveBeenCalledWith(undefined)
  })

  test('propagates errors from the query', async () => {
    mockDb.builder.rejects(new Error('DB failure'))

    await expect(findCompletedPaymentRequests(paymentRequestIds, mockDb.trx)).rejects.toThrow('DB failure')
  })
})
