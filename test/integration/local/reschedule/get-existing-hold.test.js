const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const { FRN } = require('../../../mocks/values/frn')
const { TIMESTAMP } = require('../../../mocks/values/date')

const db = require('../../../../app/database')

const { getExistingHold } = require('../../../../app/reschedule/get-existing-hold')

describe('get existing hold', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold().insert(hold)
  })

  test('should get existing hold if matched by hold category and FRN', async () => {
    const existingHold = await getExistingHold(sfiHoldCategory.holdCategoryId, FRN)
    expect(existingHold.frn).toBe(hold.frn.toString())
  })

  test('should not get existing hold if not matched by hold category', async () => {
    const existingHold = await getExistingHold(999, FRN)
    expect(existingHold).toBeNull()
  })

  test('should not get existing hold if not matched by FRN', async () => {
    const existingHold = await getExistingHold(sfiHoldCategory.holdCategoryId, '9999999999')
    expect(existingHold).toBeNull()
  })

  test('should not get closed holds', async () => {
    await db.hold().where({ holdId: hold.holdId }).update({ closed: TIMESTAMP })
    const existingHold = await getExistingHold(sfiHoldCategory.holdCategoryId, FRN)
    expect(existingHold).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
