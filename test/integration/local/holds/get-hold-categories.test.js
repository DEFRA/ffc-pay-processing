const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const { getHoldCategories } = require('../../../../app/holds/get-hold-categories')

describe('get hold categories', () => {
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

  test('should return all hold categories', async () => {
    const holdCategories = await getHoldCategories()
    expect(holdCategories.length).toBe(4)
  })

  test('should return hold categories with hold category id', async () => {
    const holdCategories = await getHoldCategories()
    expect(holdCategories[0].holdCategoryId).toBeDefined()
  })

  test('should return hold categories with name', async () => {
    const holdCategories = await getHoldCategories()
    expect(holdCategories[0].name).toBeDefined()
  })

  test('should return hold categories with scheme id', async () => {
    const holdCategories = await getHoldCategories()
    expect(holdCategories[0].schemeId).toBeDefined()
  })

  test('should return hold categories with scheme name', async () => {
    const holdCategories = await getHoldCategories()
    expect(holdCategories[0].schemeName).toBeDefined()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
