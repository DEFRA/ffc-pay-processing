const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/schemes/scheme')

const { getHoldCategory } = require('../../../../app/holds/get-hold-category')

describe('get hold category', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should return hold category if hold category id exists', async () => {
    const holdCategoryResult = await getHoldCategory(sfiHoldCategory.holdCategoryId)
    expect(holdCategoryResult).toMatchObject(sfiHoldCategory)
  })

  test('should return hold category with scheme if hold category id exists', async () => {
    const holdCategoryResult = await getHoldCategory(sfiHoldCategory.holdCategoryId)
    expect(holdCategoryResult.scheme).toMatchObject(scheme)
  })

  test('should return null if hold category id does not exist', async () => {
    const holdCategoryResult = await getHoldCategory(999)
    expect(holdCategoryResult).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
