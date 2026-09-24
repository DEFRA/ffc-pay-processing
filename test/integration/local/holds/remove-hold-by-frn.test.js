const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

const { REMOVED } = require('../../../../app/constants/hold-statuses')

const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const hold = require('../../../mocks/holds/hold')

const db = require('../../../../app/database')

const { removeHoldByFrn } = require('../../../../app/holds/remove-hold-by-frn')

describe('remove hold by frn', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    await db.hold().insert(hold)
  })

  test('should update hold with closed date', async () => {
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    const updatedHold = await db.hold().where({ holdId: hold.holdId }).first()
    expect(updatedHold.closed).not.toBeNull()
  })

  test('should send hold removed event with hold data if hold exists', async () => {
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    const updatedHold = await db.hold().where({ holdId: hold.holdId }).first()
    const plainHold = updatedHold
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, REMOVED)
  })

  test('should not send hold removed event if open hold does not exist', async () => {
    await resetDatabase()
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    expect(mockSendHoldEvent).not.toHaveBeenCalled()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
