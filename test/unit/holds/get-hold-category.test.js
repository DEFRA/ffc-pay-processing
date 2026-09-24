const { createKnexMock, createQueryBuilder } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['holdCategory', 'scheme'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getHoldCategory } = require('../../../app/holds/get-hold-category')

describe('getHoldCategory', () => {
  let holdCategoryBuilder
  let schemeBuilder

  beforeEach(() => {
    jest.clearAllMocks()
    holdCategoryBuilder = createQueryBuilder().resolves(undefined)
    schemeBuilder = createQueryBuilder().resolves(undefined)
    mockDb.tables.holdCategory.mockReturnValue(holdCategoryBuilder)
    mockDb.tables.scheme.mockReturnValue(schemeBuilder)
  })

  test('returns null and does not look up a scheme if the hold category does not exist', async () => {
    const result = await getHoldCategory(999)

    expect(holdCategoryBuilder.where).toHaveBeenCalledWith({ holdCategoryId: 999 })
    expect(result).toBeNull()
    expect(mockDb.tables.scheme).not.toHaveBeenCalled()
  })

  test('returns the hold category with its scheme', async () => {
    holdCategoryBuilder.resolves({ holdCategoryId: 1, schemeId: 2, name: 'Hold' })
    schemeBuilder.resolves({ schemeId: 2, name: 'SFI' })

    const result = await getHoldCategory(1)

    expect(schemeBuilder.where).toHaveBeenCalledWith({ schemeId: 2 })
    expect(result).toEqual({ holdCategoryId: 1, schemeId: 2, name: 'Hold', scheme: { schemeId: 2, name: 'SFI' } })
  })

  test('returns a null scheme if the scheme does not exist', async () => {
    holdCategoryBuilder.resolves({ holdCategoryId: 1, schemeId: 2, name: 'Hold' })

    const result = await getHoldCategory(1)

    expect(result.scheme).toBeNull()
  })
})
