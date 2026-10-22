const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['completedPaymentRequest'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getSettlementPaymentRequest } = require('../../../app/settlement/get-settlement-payment-request')

const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')

const filter = { invoiceNumber: INVOICE_NUMBER }

describe('getSettlementPaymentRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(undefined)
  })

  test('should query completed payment requests by settlement filter', async () => {
    await getSettlementPaymentRequest(filter)
    expect(mockDb.tables.completedPaymentRequest).toHaveBeenCalled()
    expect(mockDb.builder.where).toHaveBeenCalledWith(filter)
    expect(mockDb.builder.first).toHaveBeenCalledTimes(1)
  })

  test('should return the result of the query', async () => {
    const paymentRequest = structuredClone(
      require('../../mocks/payment-requests/payment-request')
    )
    mockDb.builder.resolves(paymentRequest)

    const result = await getSettlementPaymentRequest(filter)

    expect(result).toEqual(paymentRequest)
  })

  test('should return null if no payment request found', async () => {
    const result = await getSettlementPaymentRequest(filter)
    expect(result).toBeNull()
  })
})
