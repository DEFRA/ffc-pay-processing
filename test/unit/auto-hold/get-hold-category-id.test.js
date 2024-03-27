const { resetDatabase, closeDatabaseConnection } = require('../../helpers')

const { sfiAutoHoldCategory } = require('../../mocks/holds/hold-category')

const { getHoldCategoryId } = require('../../../app/auto-hold/get-hold-category-id')

describe('get hold category id', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should return hold category id if scheme and name exists', async () => {
    const holdCategoryId = await getHoldCategoryId(sfiAutoHoldCategory.schemeId, sfiAutoHoldCategory.name)
    expect(holdCategoryId).toBe(sfiAutoHoldCategory.autoHoldCategoryId)
  })

  test('should return undefined if scheme does not exist', async () => {
    const holdCategoryId = await getHoldCategoryId(999, sfiAutoHoldCategory.name)
    expect(holdCategoryId).toBeUndefined()
  })

  test('should return undefined if name does not exist', async () => {
    const holdCategoryId = await getHoldCategoryId(sfiAutoHoldCategory.schemeId, 'unknown')
    expect(holdCategoryId).toBeUndefined()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
