const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')
const { sfiHoldCategory, sfiPilotAutoHoldCategory } = require('../../../mocks/holds/hold-category')
const { getSchemeId } = require('../../../../app/holds/get-scheme-id')

describe('get scheme id', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
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
