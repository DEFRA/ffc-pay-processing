const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const holdCategory = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/scheme')
const { DATE } = require('../../../mocks/values/date')

const db = require('../../../../app/data')

const { getHolds } = require('../../../../app/holds/get-holds')

describe('get hold categories', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold.create(hold)
    await db.hold.create({ ...hold, holdId: 2, closed: DATE })
  })

  test('should return all holds if open only not requested', async () => {
    const holdsResult = await getHolds(false)
    expect(holdsResult.length).toBe(2)
  })

  test('should return open holds if open only requested', async () => {
    const holdsResult = await getHolds(true)
    expect(holdsResult.length).toBe(1)
  })

  test('should return open holds if no parameters', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult.length).toBe(1)
  })

  test('should return holds with hold id', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdId).toBe(hold.holdId)
  })

  test('should return holds with frn', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].frn).toBe(hold.frn.toString())
  })

  test('should return holds with hold category name', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategoryName).toBe(holdCategory.name)
  })

  test('should return holds with scheme id', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategorySchemeId).toBe(holdCategory.schemeId)
  })

  test('should return holds with scheme name', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategorySchemeName).toBe(scheme.name)
  })

  test('should return holds with date added', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].dateTimeAdded).not.toBeNull()
  })

  test('should return holds with date closed', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].dateTimeClosed).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
