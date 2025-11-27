const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/schemes/scheme')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/data')
const { getHolds } = require('../../../../app/holds/get-holds')
const autoHold = require('../../../mocks/holds/auto-hold')

let pageNumber
let pageSize

describe('get holds', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold.create(hold)
    await db.autoHold.create(autoHold)
    await db.hold.create({ ...hold, holdId: 2, closed: TIMESTAMP })
    await db.autoHold.create({ ...autoHold, autoHoldId: 2, closed: TIMESTAMP })
    pageNumber = undefined
    pageSize = undefined
  })

  test.each([
    ['all holds if open only not requested', {}, false, 4],
    ['open holds if open only requested', {}, true, 2],
    ['open holds if no parameters', {}, undefined, 2],
    ['all holds if page and pageSize not provided', {}, false, 4],
    ['all holds if page or pageSize are invalid', { pageNumber: 'invalid', pageSize: 'invalid' }, false, 4],
    ['empty array if page exceeds total pages', { pageNumber: 3, pageSize: 2 }, undefined, 0]
  ])('should return %s', async (_name, params, openOnly, expectedLength) => {
    const holdsResult = await getHolds(params, openOnly)
    expect(holdsResult.length).toBe(expectedLength)
  })

  test('should return holds with correct details', async () => {
    const holdsResult = await getHolds({ pageNumber, pageSize })

    const expected = [
      { id: hold.holdId, frn: hold.frn.toString() },
      { id: autoHold.autoHoldId, frn: autoHold.frn.toString() }
    ]

    expected.forEach((exp, idx) => {
      const result = holdsResult[idx]
      expect(result.holdId).toBe(exp.id)
      expect(result.frn).toBe(exp.frn)
      expect(result.holdCategoryName).toBe(sfiHoldCategory.name)
      expect(result.holdCategorySchemeId).toBe(sfiHoldCategory.schemeId)
      expect(result.holdCategorySchemeName).toBe(scheme.name)
      expect(result.dateTimeAdded).not.toBeNull()
      expect(result.dateTimeClosed).toBeNull()
    })
  })

  test('should return correct number of holds with valid pagination', async () => {
    pageNumber = 1
    pageSize = 1
    let holdsResult = await getHolds({ pageNumber, pageSize })
    expect(holdsResult.length).toBe(1)

    pageNumber = 2
    holdsResult = await getHolds({ pageNumber, pageSize })
    expect(holdsResult[0].holdId).toBe(1)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
