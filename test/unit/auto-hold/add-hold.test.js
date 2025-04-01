const { resetDatabase, closeDatabaseConnection } = require('../../helpers')
const { BPS } = require('../../../app/constants/schemes')

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

  test('should save new hold for non-BPS scheme', async () => {
    const nonBpsPaymentRequest = { ...paymentRequest, schemeId: 'SFI' }
    await addHold(nonBpsPaymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    expect(hold).not.toBeNull()
    expect(hold.agreementNumber).toBe(nonBpsPaymentRequest.agreementNumber)
    expect(hold.contractNumber).toBe(nonBpsPaymentRequest.contractNumber)
  })

  test('should save new hold for BPS scheme without agreement and contract numbers', async () => {
    const bpsPaymentRequest = { ...paymentRequest, schemeId: BPS }
    await addHold(bpsPaymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    expect(hold).not.toBeNull()
    expect(hold.agreementNumber).toBeNull()
    expect(hold.contractNumber).toBeNull()
  })

  test('should send hold added event with hold data', async () => {
    await addHold(paymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    const plainHold = hold.get({ plain: true })
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, ADDED)
  })

  test('should use provided transaction', async () => {
    const transaction = await db.sequelize.transaction()
    await addHold(paymentRequest, holdCategoryId, transaction)
    const holdInTransaction = await db.autoHold.findOne({
      where: { frn: FRN },
      transaction
    })
    expect(holdInTransaction).not.toBeNull()
    await transaction.rollback()
    const holdAfterRollback = await db.autoHold.findOne({ where: { frn: FRN } })
    expect(holdAfterRollback).toBeNull()
  })

  test('should set correct fields', async () => {
    const now = new Date()
    Date.now = jest.fn(() => now)
    await addHold(paymentRequest, holdCategoryId)
    const hold = await db.autoHold.findOne({ where: { frn: FRN } })
    expect(Number(hold.frn)).toBe(paymentRequest.frn)
    expect(hold.autoHoldCategoryId).toBe(holdCategoryId)
    expect(hold.marketingYear).toBe(paymentRequest.marketingYear)
    expect(hold.added).toEqual(now)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
