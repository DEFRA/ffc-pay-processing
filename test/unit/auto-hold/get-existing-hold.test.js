jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ BPS: 5 }))
}))

jest.mock('../../../app/data', () => ({
  autoHold: {
    findOne: jest.fn()
  }
}))

const db = require('../../../app/data')
const { getExistingHold } = require('../../../app/auto-hold/get-existing-hold')

describe('getExistingHold', () => {
  const transaction = { id: 'transaction-1' }
  const categoryId = 1
  const basePaymentRequest = {
    frn: '1234567890',
    marketingYear: 2023,
    agreementNumber: 'SIP00001',
    contractNumber: 'CONT001'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('finds a BPS hold without agreement or contract numbers', async () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: 5
    }

    await getExistingHold(categoryId, paymentRequest, transaction)

    expect(db.autoHold.findOne).toHaveBeenCalledWith({
      transaction,
      where: {
        autoHoldCategoryId: categoryId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        closed: null
      }
    })
  })

  test('finds a non-BPS hold with agreement and contract numbers', async () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: 1
    }

    await getExistingHold(categoryId, paymentRequest, transaction)

    expect(db.autoHold.findOne).toHaveBeenCalledWith({
      transaction,
      where: {
        autoHoldCategoryId: categoryId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        closed: null,
        agreementNumber: paymentRequest.agreementNumber,
        contractNumber: paymentRequest.contractNumber
      }
    })
  })

  test('returns the existing hold', async () => {
    const existingHold = { id: 1, frn: basePaymentRequest.frn }
    db.autoHold.findOne.mockResolvedValue(existingHold)

    const result = await getExistingHold(
      categoryId,
      { ...basePaymentRequest, schemeId: 5 },
      transaction
    )

    expect(result).toBe(existingHold)
  })

  test('passes an undefined transaction when none is supplied', async () => {
    const paymentRequest = {
      ...basePaymentRequest,
      schemeId: 5
    }

    await getExistingHold(categoryId, paymentRequest)

    expect(db.autoHold.findOne).toHaveBeenCalledWith({
      transaction: undefined,
      where: {
        autoHoldCategoryId: categoryId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        closed: null
      }
    })
  })
})
