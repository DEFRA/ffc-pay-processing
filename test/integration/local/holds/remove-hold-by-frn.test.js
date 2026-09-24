const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

const { REMOVED } = require('../../../../app/constants/hold-statuses')

const { sfiHoldCategory } = require('../../../mocks/holds/hold-category')
const hold = require('../../../mocks/holds/hold')

const db = require('../../../../app/data')

const { removeHoldByFrn } = require('../../../../app/holds/remove-hold-by-frn')

describe('remove hold by frn', () => {
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

  test('should update hold with closed date', async () => {
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    const updatedHold = await db.hold.findOne({ where: { holdId: hold.holdId } })
    expect(updatedHold.closed).not.toBeNull()
  })

  test('should send hold removed event with hold data if hold exists', async () => {
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    const updatedHold = await db.hold.findOne({ where: { holdId: hold.holdId } })
    const plainHold = updatedHold.get({ plain: true })
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, REMOVED)
  })

  test('should not send hold removed event if open hold does not exist', async () => {
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
    await removeHoldByFrn(sfiHoldCategory.schemeId, hold.frn, sfiHoldCategory.name)
    expect(mockSendHoldEvent).not.toHaveBeenCalled()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
