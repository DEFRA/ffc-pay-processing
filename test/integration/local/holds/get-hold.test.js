const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

const hold = require('../../../mocks/holds/hold')
const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const scheme = require('../../../mocks/schemes/scheme')

const db = require('../../../../app/data')

const { getHold } = require('../../../../app/holds/get-hold')

describe('get hold', () => {
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
    await db.hold.create(hold)
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
