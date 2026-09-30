jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ BPS: 6 }))
}))

jest.mock('../../../app/data', () => ({
  autoHold: {
    findOne: jest.fn(),
    update: jest.fn()
  },
  autoHoldCategory: {
    findOne: jest.fn(),
    update: jest.fn()
  }
}))

jest.mock('../../../app/auto-hold/get-hold-category-id', () => ({
  getHoldCategoryId: jest.fn()
}))

jest.mock('../../../app/event', () => ({
  sendHoldEvent: jest.fn()
}))

const db = require('../../../app/data')
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

    db.autoHold.findOne.mockResolvedValue(hold)

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
    expect(db.autoHold.findOne).toHaveBeenCalledWith({ where, raw: true })
    expect(db.autoHold.update).toHaveBeenCalledWith(
      { closed: expect.any(Date) },
      { where }
    )

    const closed = db.autoHold.update.mock.calls[0][0].closed

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

    db.autoHold.findOne.mockResolvedValue(hold)

    await removeAutoHold(bpsPaymentRequest, 'hold-category')

    const where = {
      frn: bpsPaymentRequest.frn,
      marketingYear: bpsPaymentRequest.marketingYear,
      autoHoldCategoryId: 42,
      closed: null
    }

    expect(db.autoHold.findOne).toHaveBeenCalledWith({ where, raw: true })
    expect(db.autoHold.update).toHaveBeenCalledWith(
      { closed: expect.any(Date) },
      { where }
    )
  })

  test('does not update or publish an event when no auto-hold exists', async () => {
    db.autoHold.findOne.mockResolvedValue(null)

    await removeAutoHold(paymentRequest, 'hold-category')

    expect(db.autoHold.update).not.toHaveBeenCalled()
    expect(sendHoldEvent).not.toHaveBeenCalled()
  })
})
