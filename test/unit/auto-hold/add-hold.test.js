jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ BPS: 5 }))
}))

const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['autoHold'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../../app/event', () => ({
  sendHoldEvent: jest.fn()
}))

const { addHold } = require('../../../app/auto-hold/add-hold')
const { sendHoldEvent } = require('../../../app/event')
const { ADDED } = require('../../../app/constants/hold-statuses')

describe('add auto hold', () => {
  const paymentRequest = {
    frn: 1234567890,
    marketingYear: 2024,
    agreementNumber: 'AGREEMENT-1',
    contractNumber: 'CONTRACT-1',
    schemeId: 1
  }

  const categoryId = 1
  const hold = { id: 10, ...paymentRequest, autoHoldCategoryId: categoryId }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([hold])
  })

  test('creates a hold with agreement and contract numbers for non-BPS schemes', async () => {
    const before = new Date()
    await addHold(paymentRequest, categoryId)
    const after = new Date()

    expect(mockDb.tables.autoHold).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.insert).toHaveBeenCalledWith(expect.objectContaining({
      frn: paymentRequest.frn,
      autoHoldCategoryId: categoryId,
      marketingYear: paymentRequest.marketingYear,
      agreementNumber: paymentRequest.agreementNumber,
      contractNumber: paymentRequest.contractNumber
    }))
    const [[insertedFields]] = mockDb.builder.insert.mock.calls
    expect(insertedFields.added.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(insertedFields.added.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(mockDb.builder.returning).toHaveBeenCalledWith('*')
  })

  test('omits agreement and contract numbers for BPS schemes', async () => {
    const bpsPaymentRequest = { ...paymentRequest, schemeId: 5 }

    await addHold(bpsPaymentRequest, categoryId)

    const [[insertedFields]] = mockDb.builder.insert.mock.calls
    expect(insertedFields).toEqual({
      frn: bpsPaymentRequest.frn,
      autoHoldCategoryId: categoryId,
      marketingYear: bpsPaymentRequest.marketingYear,
      added: expect.any(Date)
    })
  })

  test('uses the supplied transaction', async () => {
    const transaction = { id: 'transaction-1' }

    await addHold(paymentRequest, categoryId, transaction)

    expect(mockDb.tables.autoHold).toHaveBeenCalledWith(transaction)
  })

  test('sends the hold added event using the inserted hold', async () => {
    await addHold(paymentRequest, categoryId)

    expect(sendHoldEvent).toHaveBeenCalledWith(hold, ADDED)
  })
})
