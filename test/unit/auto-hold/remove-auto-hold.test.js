jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ BPS: 6 }))
}))

const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['autoHold'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../../app/auto-hold/get-hold-category-id', () => ({
  getHoldCategoryId: jest.fn()
}))

jest.mock('../../../app/event', () => ({
  sendHoldEvent: jest.fn()
}))

const { getHoldCategoryId } = require('../../../app/auto-hold/get-hold-category-id')
const { removeAutoHold } = require('../../../app/auto-hold/remove-auto-hold')
const { sendHoldEvent } = require('../../../app/event')
const { REMOVED } = require('../../../app/constants/hold-statuses')

describe('removeAutoHold', () => {
  const paymentRequest = {
    schemeId: 1,
    frn: 1234567890,
    marketingYear: 2025,
    agreementNumber: 'AGREEMENT-1',
    contractNumber: 'CONTRACT-1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    getHoldCategoryId.mockResolvedValue(42)
  })

  test('removes an auto-hold for a non-BPS scheme', async () => {
    const hold = {
      id: 1,
      frn: paymentRequest.frn,
      marketingYear: paymentRequest.marketingYear,
      autoHoldCategoryId: 42,
      agreementNumber: paymentRequest.agreementNumber,
      contractNumber: paymentRequest.contractNumber,
      closed: null
    }

    mockDb.builder.resolves(hold)

    await removeAutoHold(paymentRequest, 'hold-category')

    const where = {
      frn: paymentRequest.frn,
      marketingYear: paymentRequest.marketingYear,
      autoHoldCategoryId: 42,
      closed: null,
      agreementNumber: paymentRequest.agreementNumber,
      contractNumber: paymentRequest.contractNumber
    }

    expect(getHoldCategoryId).toHaveBeenCalledWith(
      paymentRequest.schemeId,
      'hold-category'
    )
    expect(mockDb.builder.where).toHaveBeenCalledWith(where)
    expect(mockDb.builder.update).toHaveBeenCalledWith({ closed: expect.any(Date) })

    const closed = mockDb.builder.update.mock.calls[0][0].closed

    expect(sendHoldEvent).toHaveBeenCalledWith(
      { ...hold, closed },
      REMOVED
    )
  })

  test('removes an auto-hold for BPS without agreement or contract numbers', async () => {
    const bpsPaymentRequest = {
      ...paymentRequest,
      schemeId: 6
    }

    const hold = {
      id: 1,
      frn: bpsPaymentRequest.frn,
      marketingYear: bpsPaymentRequest.marketingYear,
      autoHoldCategoryId: 42,
      closed: null
    }

    mockDb.builder.resolves(hold)

    await removeAutoHold(bpsPaymentRequest, 'hold-category')

    const where = {
      frn: bpsPaymentRequest.frn,
      marketingYear: bpsPaymentRequest.marketingYear,
      autoHoldCategoryId: 42,
      closed: null
    }

    expect(mockDb.builder.where).toHaveBeenCalledWith(where)
    expect(mockDb.builder.update).toHaveBeenCalledWith({ closed: expect.any(Date) })
  })

  test('does not update or publish an event when no auto-hold exists', async () => {
    mockDb.builder.resolves(undefined)

    await removeAutoHold(paymentRequest, 'hold-category')

    expect(mockDb.builder.update).not.toHaveBeenCalled()
    expect(sendHoldEvent).not.toHaveBeenCalled()
  })
})
