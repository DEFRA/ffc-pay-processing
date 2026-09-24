const { createKnexMock } = require('../../helpers/mock-knex')
const { BPS } = require('../../../app/constants/schemes')

const mockDb = createKnexMock(['autoHold'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getExistingHold } = require('../../../app/auto-hold/get-existing-hold')

describe('getExistingHold', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(undefined)
  })

  test('should query with correct parameters for BPS scheme', async () => {
    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      agreementNumber: 'SIP00001',
      contractNumber: 'CONT001',
      schemeId: BPS
    }

    await getExistingHold(autoHoldCategoryId, paymentRequest, mockDb.trx)

    expect(mockDb.tables.autoHold).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({
      autoHoldCategoryId: 1,
      frn: '1234567890',
      marketingYear: 2023,
      closed: null
    })
    expect(mockDb.builder.first).toHaveBeenCalledTimes(1)
  })

  test('should query with correct parameters for non-BPS scheme', async () => {
    const autoHoldCategoryId = 1
    const paymentRequest = {
      frn: '1234567890',
      marketingYear: 2023,
      agreementNumber: 'SIP00001',
      contractNumber: 'CONT001',
      schemeId: 'SFI'
    }

    await getExistingHold(autoHoldCategoryId, paymentRequest, mockDb.trx)

    expect(mockDb.builder.where).toHaveBeenCalledWith({
      autoHoldCategoryId: 1,
      frn: '1234567890',
      marketingYear: 2023,
      closed: null,
      agreementNumber: 'SIP00001',
      contractNumber: 'CONT001'
    })
  })

  test('should return the matching hold', async () => {
    const mockHold = { id: 1, frn: '1234567890' }
    mockDb.builder.resolves(mockHold)

    const result = await getExistingHold(1, { frn: '1234567890', marketingYear: 2023, schemeId: BPS }, mockDb.trx)

    expect(result).toBe(mockHold)
  })

  test('should return null if no hold found', async () => {
    const result = await getExistingHold(1, { frn: '1234567890', marketingYear: 2023, schemeId: BPS }, mockDb.trx)

    expect(result).toBeNull()
  })

  test.each([undefined, null])('should query outside a transaction when transaction is %s', async (transaction) => {
    await getExistingHold(1, { frn: '1234567890', marketingYear: 2023, schemeId: BPS }, transaction)

    expect(mockDb.tables.autoHold).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.where).toHaveBeenCalledWith(expect.any(Object))
  })
})
