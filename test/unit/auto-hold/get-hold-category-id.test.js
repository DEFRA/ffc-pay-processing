const { resetDatabase, closeDatabaseConnection } = require('../../helpers')
const { sfiAutoHoldCategory } = require('../../mocks/holds/hold-category')
const { getHoldCategoryId } = require('../../../app/auto-hold/get-hold-category-id')

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

  test.each([
    ['valid scheme + valid name', sfiAutoHoldCategory.schemeId, sfiAutoHoldCategory.name, sfiAutoHoldCategory.autoHoldCategoryId],
    ['invalid scheme', 999, sfiAutoHoldCategory.name, undefined],
    ['invalid name', sfiAutoHoldCategory.schemeId, 'unknown', undefined]
  ])('returns correct category id for %s', async (_, schemeId, name, expected) => {
    const result = await getHoldCategoryId(schemeId, name)
    expect(result).toBe(expected)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
