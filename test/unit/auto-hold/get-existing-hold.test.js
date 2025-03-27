const { resetDatabase, closeDatabaseConnection } = require('../../helpers')
const { BPS } = require('../../../app/constants/schemes')

jest.mock('../../../app/data')
const db = require('../../../app/data')

const { getExistingHold } = require('../../../app/auto-hold/get-existing-hold')

describe('getExistingHold', () => {
  const mockFindOne = jest.fn()
  const mockTransaction = {}

  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    db.autoHold.findOne = mockFindOne
  })

  test('should call findOne with correct parameters for BPS scheme', async () => {
    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      agreementNumber: 'SIP00001',
      contractNumber: 'CONT001',
      schemeId: BPS
    }

    await getExistingHold(autoHoldCategoryId, paymentRequest, mockTransaction)

    expect(mockFindOne).toHaveBeenCalledWith({
      transaction: mockTransaction,
      where: {
        autoHoldCategoryId: 1,
        frn: '1234567890',
        marketingYear: 2023,
        closed: null
      }
    })
  })

  test('should call findOne with correct parameters for non-BPS scheme', async () => {
    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      agreementNumber: 'SIP00001',
      contractNumber: 'CONT001',
      schemeId: 'SFI'
    }

    await getExistingHold(autoHoldCategoryId, paymentRequest, mockTransaction)

    expect(mockFindOne).toHaveBeenCalledWith({
      transaction: mockTransaction,
      where: {
        autoHoldCategoryId: 1,
        frn: '1234567890',
        marketingYear: 2023,
        closed: null,
        agreementNumber: 'SIP00001',
        contractNumber: 'CONT001'
      }
    })
  })

  test('should return the result of findOne', async () => {
    const mockHold = { id: 1, frn: '1234567890' }
    mockFindOne.mockResolvedValue(mockHold)

    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      schemeId: BPS
    }

    const result = await getExistingHold(autoHoldCategoryId, paymentRequest, mockTransaction)

    expect(result).toBe(mockHold)
  })

  test('should handle null transaction', async () => {
    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      schemeId: BPS
    }

    await getExistingHold(autoHoldCategoryId, paymentRequest)

    expect(mockFindOne).toHaveBeenCalledWith({
      transaction: undefined,
      where: expect.any(Object)
    })
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
