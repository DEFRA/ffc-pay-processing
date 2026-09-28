const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')
const { sfiHoldCategory, sfiPilotAutoHoldCategory } = require('../../../mocks/holds/hold-category')
const { getSchemeId } = require('../../../../app/holds/get-scheme-id')

describe('get scheme id', () => {
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

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test.each([
    ['hold category exists', sfiHoldCategory.holdCategoryId, null, sfiHoldCategory.schemeId],
    ['hold category does not exist', 999, null, undefined],
    ['auto hold category exists', null, sfiPilotAutoHoldCategory.autoHoldCategoryId, sfiPilotAutoHoldCategory.schemeId],
    ['auto hold category does not exist', null, 999, undefined],
    ['both hold and auto hold category present', sfiHoldCategory.holdCategoryId, sfiPilotAutoHoldCategory.autoHoldCategoryId, sfiHoldCategory.schemeId]
  ])('should return correct scheme id when %s', async (_desc, holdCategoryId, autoHoldCategoryId, expected) => {
    const schemeId = await getSchemeId(holdCategoryId, autoHoldCategoryId)
    expect(schemeId).toBe(expected)
  })
})
