const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/schemes/scheme')

const db = require('../../../../app/database')

const { getHold } = require('../../../../app/holds/get-hold')

describe('get hold', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold().insert(hold)
  })

  test('should return hold if hold id exists', async () => {
    const holdResult = await getHold(hold.holdId)
    expect(holdResult.frn).toBe(hold.frn.toString())
  })

  test('should return hold with hold category if hold id exists', async () => {
    const holdResult = await getHold(hold.holdId)
    expect(holdResult.holdCategory).toMatchObject(sfiHoldCategory)
  })

  test('should return hold with scheme if hold id exists', async () => {
    const holdResult = await getHold(hold.holdId)
    expect(holdResult.holdCategory.scheme).toMatchObject(scheme)
  })

  test('should return null if hold id does not exist', async () => {
    const holdResult = await getHold(999)
    expect(holdResult).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
