const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['hold', 'paymentRequest', 'invoiceLine'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getHeldPaymentRequests } = require('../../../app/holds/get-held-payment-requests')

const mockResolvesFor = (table, value) => {
  mockDb.tables[table].mockImplementationOnce(() => {
    mockDb.builder.resolves(value)
    return mockDb.builder
  })
}

describe('getHeldPaymentRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([])
  })

  test('looks for open hold for FRN and scheme', async () => {
    await getHeldPaymentRequests(1234567890, 1)

    expect(mockDb.builder.join).toHaveBeenCalledWith('holdCategories', 'holds.holdCategoryId', 'holdCategories.holdCategoryId')
    expect(mockDb.builder.where).toHaveBeenCalledWith({ 'holds.frn': 1234567890, 'holdCategories.schemeId': 1 })
    expect(mockDb.builder.whereNull).toHaveBeenCalledWith('holds.closed')
  })

  test('returns empty array without querying payment requests if no open hold', async () => {
    mockResolvesFor('hold', undefined)

    const result = await getHeldPaymentRequests(1234567890, 1)

    expect(result).toEqual([])
    expect(mockDb.tables.paymentRequest).not.toHaveBeenCalled()
  })

  test('filters incomplete schedules for FRN and scheme if open hold', async () => {
    mockResolvesFor('hold', { holdId: 1 })

    await getHeldPaymentRequests(1234567890, 1)

    expect(mockDb.builder.join).toHaveBeenCalledWith('schedule', 'paymentRequests.paymentRequestId', 'schedule.paymentRequestId')
    expect(mockDb.builder.where).toHaveBeenCalledWith({ 'paymentRequests.frn': 1234567890, 'paymentRequests.schemeId': 1 })
    expect(mockDb.builder.whereNull).toHaveBeenCalledWith('schedule.completed')
    expect(mockDb.builder.where).not.toHaveBeenCalledWith('paymentRequests.paymentRequestId', expect.anything())
  })

  test('filters to payment request id if provided', async () => {
    mockResolvesFor('hold', { holdId: 1 })

    await getHeldPaymentRequests(1234567890, 1, { paymentRequestId: 5 })

    expect(mockDb.builder.where).toHaveBeenCalledWith('paymentRequests.paymentRequestId', 5)
  })

  test('returns empty array without loading invoice lines if no pending payment requests', async () => {
    mockResolvesFor('hold', { holdId: 1 })
    mockResolvesFor('paymentRequest', [])

    const result = await getHeldPaymentRequests(1234567890, 1)

    expect(result).toEqual([])
    expect(mockDb.tables.invoiceLine).not.toHaveBeenCalled()
  })

  test('attaches invoice lines to each held payment request', async () => {
    const paymentRequests = [{ paymentRequestId: 1 }, { paymentRequestId: 2 }]
    const invoiceLines = [{ invoiceLineId: 1, paymentRequestId: 1 }, { invoiceLineId: 2, paymentRequestId: 2 }]
    mockResolvesFor('hold', { holdId: 1 })
    mockResolvesFor('paymentRequest', paymentRequests)
    mockResolvesFor('invoiceLine', invoiceLines)

    const result = await getHeldPaymentRequests(1234567890, 1)

    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('paymentRequestId', [1, 2])
    expect(result).toEqual([
      { paymentRequestId: 1, invoiceLines: [invoiceLines[0]] },
      { paymentRequestId: 2, invoiceLines: [invoiceLines[1]] }
    ])
  })
})
