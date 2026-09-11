const { getSchemeIds } = require('ffc-pay-schemes')

const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

jest.mock('../../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../../app/event')

jest.mock('../../../../app/auto-hold/get-hold-category-id')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../../app/auto-hold/get-hold-category-id')

const { REMOVED } = require('../../../../app/constants/hold-statuses')
const { BPS } = getSchemeIds()

const { sfiAutoHoldCategory, bpsAutoHoldCategory } = require('../../../mocks/holds/hold-category')
const hold = require('../../../mocks/holds/auto-hold')

const db = require('../../../../app/data')

const { removeAutoHold } = require('../../../../app/auto-hold/remove-auto-hold')
const paymentRequest = require('../../../mocks/payment-requests/payment-request')

describe('remove auto hold', () => {
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
    await db.autoHold.create(hold)
    mockGetHoldCategoryId.mockResolvedValue(sfiAutoHoldCategory.autoHoldCategoryId)
  })

  test('should update hold with closed date for non-BPS scheme', async () => {
    const nonBpsPaymentRequest = { ...paymentRequest, schemeId: 'SFI' }
    await removeAutoHold(nonBpsPaymentRequest, sfiAutoHoldCategory.name)
    const updatedHold = await db.autoHold.findOne({ where: { autoHoldId: hold.autoHoldId } })
    expect(updatedHold.closed).not.toBeNull()
  })

  test('should update hold with closed date for BPS scheme', async () => {
    const bpsPaymentRequest = { ...paymentRequest, schemeId: BPS }
    await removeAutoHold(bpsPaymentRequest, bpsAutoHoldCategory.name)
    const updatedHold = await db.autoHold.findOne({ where: { autoHoldId: hold.autoHoldId } })
    expect(updatedHold.closed).not.toBeNull()
  })

  test('should send hold removed event with hold data if hold exists', async () => {
    await removeAutoHold(paymentRequest, sfiAutoHoldCategory.name)
    const updatedHold = await db.autoHold.findOne({ where: { autoHoldId: hold.autoHoldId } })
    const plainHold = updatedHold.get({ plain: true })
    expect(mockSendHoldEvent).toHaveBeenCalledWith(expect.objectContaining(plainHold), REMOVED)
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
    await removeAutoHold(paymentRequest, sfiAutoHoldCategory.name)
    expect(mockSendHoldEvent).not.toHaveBeenCalled()
  })

  test('should call getHoldCategoryId with correct parameters', async () => {
    await removeAutoHold(paymentRequest, sfiAutoHoldCategory.name)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, sfiAutoHoldCategory.name)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
