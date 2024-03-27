const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/schemes/scheme')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/data')

const { getHolds } = require('../../../../app/holds/get-holds')
const autoHold = require('../../../mocks/holds/auto-hold')

describe('get holds', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold.create(hold)
    await db.autoHold.create(autoHold)
    await db.hold.create({ ...hold, holdId: 2, closed: TIMESTAMP })
    await db.autoHold.create({ ...autoHold, autoHoldId: 2, closed: TIMESTAMP })
  })

  test('should return all holds if open only not requested', async () => {
    const holdsResult = await getHolds(false)
    expect(holdsResult.length).toBe(4)
  })

  test('should return open holds if open only requested', async () => {
    const holdsResult = await getHolds(true)
    expect(holdsResult.length).toBe(2)
  })

  test('should return open holds if no parameters', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult.length).toBe(2)
  })

  test('should return holds with hold id', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdId).toBe(hold.holdId)
    expect(holdsResult[1].holdId).toBe(autoHold.autoHoldId)
  })

  test('should return holds with frn', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].frn).toBe(hold.frn.toString())
    expect(holdsResult[1].frn).toBe(autoHold.frn.toString())
  })

  test('should return holds with hold category name', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategoryName).toBe(sfiHoldCategory.name)
    expect(holdsResult[1].holdCategoryName).toBe(sfiHoldCategory.name)
  })

  test('should return holds with scheme id', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategorySchemeId).toBe(sfiHoldCategory.schemeId)
    expect(holdsResult[1].holdCategorySchemeId).toBe(sfiHoldCategory.schemeId)
  })

  test('should return holds with scheme name', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].holdCategorySchemeName).toBe(scheme.name)
    expect(holdsResult[1].holdCategorySchemeName).toBe(scheme.name)
  })

  test('should return holds with date added', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].dateTimeAdded).not.toBeNull()
    expect(holdsResult[1].dateTimeAdded).not.toBeNull()
  })

  test('should return holds with date closed', async () => {
    const holdsResult = await getHolds()
    expect(holdsResult[0].dateTimeClosed).toBeNull()
    expect(holdsResult[1].dateTimeClosed).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
