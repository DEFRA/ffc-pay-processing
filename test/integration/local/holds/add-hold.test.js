const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

const { FRN } = require('../../../mocks/values/frn')

const { ADDED } = require('../../../../app/constants/hold-statuses')

const db = require('../../../../app/data')

const { addHold } = require('../../../../app/holds/add-hold')

const holdCategoryId = 1

describe('add hold', () => {
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
  })

  test('should save new hold', async () => {
    await addHold(FRN, holdCategoryId)
    const hold = await db.hold.findOne({ where: { frn: FRN } })
    expect(hold).not.toBeNull()
  })

  test('should send hold added event with hold data', async () => {
    await addHold(FRN, holdCategoryId)
    const hold = await db.hold.findOne({ where: { frn: FRN } })
    const plainHold = hold.get({ plain: true })
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, ADDED)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
