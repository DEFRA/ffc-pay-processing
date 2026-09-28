const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')

const { getHoldCategoryId } = require('../../../../app/holds/get-hold-category-id')

describe('get hold category id', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    try {
      await resetDatabase()
    } catch (error) {
      console.error({
        message: error.message,
        name: error.name,
        parentMessage: error.parent?.message,
        originalMessage: error.original?.message,
        detail: error.parent?.detail,
        constraint: error.parent?.constraint,
        table: error.parent?.table
      })

      throw error
    }
  })

  test('should return hold category id if scheme and name exists', async () => {
    const holdCategoryId = await getHoldCategoryId(sfiHoldCategory.schemeId, sfiHoldCategory.name)
    expect(holdCategoryId).toBe(sfiHoldCategory.holdCategoryId)
  })

  test('should return undefined if scheme does not exist', async () => {
    const holdCategoryId = await getHoldCategoryId(999, sfiHoldCategory.name)
    expect(holdCategoryId).toBeUndefined()
  })

  test('should return undefined if name does not exist', async () => {
    const holdCategoryId = await getHoldCategoryId(sfiHoldCategory.schemeId, 'unknown')
    expect(holdCategoryId).toBeUndefined()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
