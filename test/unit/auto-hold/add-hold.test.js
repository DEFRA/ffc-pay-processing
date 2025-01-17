const { resetDatabase, closeDatabaseConnection } = require('../../helpers')

jest.mock('../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../app/event')

const { FRN } = require('../../mocks/values/frn')

const { ADDED } = require('../../../app/constants/hold-statuses')

const db = require('../../../app/data')

const { addHold } = require('../../../app/auto-hold/add-hold')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

const holdCategoryId = 1

describe('add auto hold', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
  })

  test('should save new hold', async () => {
    await addHold(paymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    expect(hold).not.toBeNull()
  })

  test('should send hold added event with hold data', async () => {
    await addHold(paymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    const plainHold = hold.get({ plain: true })
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, ADDED)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
