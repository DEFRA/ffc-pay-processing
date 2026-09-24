const { closeDatabaseConnection, resetDatabase } = require('../../../helpers')

const { FRN } = require('../../../mocks/values/frn')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

const db = require('../../../../app/database')

const { removeBulkHold } = require('../../../../app/holds/remove-bulk-hold')

describe('remove bulk hold', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold().insert({
      frn: FRN, holdCategoryId: 1, added: new Date()
    })
    await db.hold().insert({
      frn: 1234567891, holdCategoryId: 1, added: new Date()
    })
  })

  test('should set hold closed if file contains one entry', async () => {
    await removeBulkHold([FRN], 1)
    const hold = await db.hold().where({ frn: FRN }).first()
    expect(hold.closed).not.toBeNull()
  })

  test('should not close holds with other category ID if multiple', async () => {
    await db.hold().insert({
      frn: FRN, holdCategoryId: 2, added: new Date()
    })
    await removeBulkHold([FRN], 1)
    const hold = await db.hold().where({ frn: FRN, holdCategoryId: 2 }).first()
    expect(hold.closed).toBeNull()
  })

  test('should set holds closed if file contains multiple entry', async () => {
    await removeBulkHold([FRN, 1234567891], 1)
    const hold = await db.hold().where({ frn: 1234567891 }).first()
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
