jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ BPS: 5 }))
}))

jest.mock('../../../app/data', () => ({
  autoHold: {
    create: jest.fn()
  }
}))

jest.mock('../../../app/event', () => ({
  sendHoldEvent: jest.fn()
}))

const db = require('../../../app/data')
const { sendHoldEvent } = require('../../../app/event')
const { addHold } = require('../../../app/auto-hold/add-hold')
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
  const plainHold = { id: 10, ...paymentRequest, autoHoldCategoryId: categoryId }
  const hold = {
    get: jest.fn(() => plainHold)
  }

  beforeEach(() => {
    jest.clearAllMocks()
    db.autoHold.create.mockResolvedValue(hold)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('creates a hold with agreement and contract numbers for non-BPS schemes', async () => {
    const added = new Date('2024-01-01')
    jest.spyOn(Date, 'now').mockReturnValue(added.getTime())

    await addHold(paymentRequest, categoryId)

    expect(db.autoHold.create).toHaveBeenCalledWith(
      {
        frn: paymentRequest.frn,
        autoHoldCategoryId: categoryId,
        marketingYear: paymentRequest.marketingYear,
        added: added.getTime(),
        agreementNumber: paymentRequest.agreementNumber,
        contractNumber: paymentRequest.contractNumber
      },
      { transaction: undefined }
    )
  })

  test('omits agreement and contract numbers for BPS schemes', async () => {
    const bpsPaymentRequest = {
      ...paymentRequest,
      schemeId: 5
    }

    await addHold(bpsPaymentRequest, categoryId)

    expect(db.autoHold.create).toHaveBeenCalledWith(
      {
        frn: bpsPaymentRequest.frn,
        autoHoldCategoryId: categoryId,
        marketingYear: bpsPaymentRequest.marketingYear,
        added: expect.any(Number)
      },
      { transaction: undefined }
    )
  })

  test('uses the supplied transaction', async () => {
    const transaction = { id: 'transaction-1' }

    await addHold(paymentRequest, categoryId, transaction)

    expect(db.autoHold.create).toHaveBeenCalledWith(
      expect.any(Object),
      { transaction }
    )
  })

  test('sends the hold added event using plain hold data', async () => {
    await addHold(paymentRequest, categoryId)

    expect(hold.get).toHaveBeenCalledWith({ plain: true })
    expect(sendHoldEvent).toHaveBeenCalledWith(plainHold, ADDED)
  })
})
