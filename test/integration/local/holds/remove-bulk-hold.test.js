const { closeDatabaseConnection, resetDatabase } = require('../../../helpers')

const { FRN } = require('../../../mocks/values/frn')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

const db = require('../../../../app/data')

const { removeBulkHold } = require('../../../../app/holds/remove-bulk-hold')

describe('remove bulk hold', () => {
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
    await db.hold.create({
      frn: FRN, holdCategoryId: 1, added: Date.now()
    })
    await db.hold.create({
      frn: 1234567891, holdCategoryId: 1, added: Date.now()
    })
  })

  test('should set hold closed if file contains one entry', async () => {
    await removeBulkHold([FRN], 1)
    const hold = await db.hold.findOne({ where: { frn: FRN } })
    expect(hold.closed).not.toBeNull()
  })

  test('should not close holds with other category ID if multiple', async () => {
    await db.hold.create({
      frn: FRN, holdCategoryId: 2, added: Date.now()
    })
    await removeBulkHold([FRN], 1)
    const hold = await db.hold.findOne({ where: { frn: FRN, holdCategoryId: 2 } })
    expect(hold.closed).toBeNull()
  })

  test('should set holds closed if file contains multiple entry', async () => {
    await removeBulkHold([FRN, 1234567891], 1)
    const hold = await db.hold.findOne({ where: { frn: 1234567891 } })
    expect(hold.closed).not.toBeNull()
  })

  test('should send event for each hold removed', async () => {
    await removeBulkHold([FRN, 1234567891], 1)
    expect(mockSendHoldEvent).toHaveBeenCalledTimes(2)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
