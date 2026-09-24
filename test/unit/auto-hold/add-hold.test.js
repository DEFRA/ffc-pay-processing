const { resetDatabase, closeDatabaseConnection } = require('../../helpers')
const { BPS } = require('../../../app/constants/schemes')

jest.mock('../../../app/event')
const { sendHoldEvent: mockSendHoldEvent } = require('../../../app/event')

const { FRN } = require('../../mocks/values/frn')

const { ADDED } = require('../../../app/constants/hold-statuses')

const db = require('../../../app/database')

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
    const hold = await db.autoHold().where({ frn: FRN }).first()
    expect(hold).toBeDefined()
    expect(hold.agreementNumber).toBe(nonBpsPaymentRequest.agreementNumber)
    expect(hold.contractNumber).toBe(nonBpsPaymentRequest.contractNumber)
  })

  test('should save new hold for BPS scheme without agreement and contract numbers', async () => {
    const bpsPaymentRequest = { ...paymentRequest, schemeId: BPS }
    await addHold(bpsPaymentRequest, holdCategoryId)
    const hold = await db.autoHold().where({ frn: FRN }).first()
    expect(hold).toBeDefined()
    expect(hold.agreementNumber).toBeNull()
    expect(hold.contractNumber).toBeNull()
  })

  test('should send hold added event with hold data', async () => {
    await addHold(paymentRequest, holdCategoryId)
    const hold = await db.autoHold().where({ frn: FRN }).first()
    const plainHold = hold
    expect(mockSendHoldEvent).toHaveBeenCalledWith(plainHold, ADDED)
  })

  test('should use provided transaction', async () => {
    const transaction = await db.transaction()
    await addHold(paymentRequest, holdCategoryId, transaction)
    const holdInTransaction = await db.autoHold(transaction).where({ frn: FRN }).first()
    expect(holdInTransaction).toBeDefined()
    await transaction.rollback()
    const holdAfterRollback = await db.autoHold().where({ frn: FRN }).first()
    expect(holdAfterRollback).toBeUndefined()
  })

  test('should set correct fields', async () => {
    const before = new Date()
    await addHold(paymentRequest, holdCategoryId)
    const after = new Date()
    const hold = await db.autoHold().where({ frn: FRN }).first()
    expect(Number(hold.frn)).toBe(paymentRequest.frn)
    expect(hold.autoHoldCategoryId).toBe(holdCategoryId)
    expect(hold.marketingYear).toBe(paymentRequest.marketingYear)
    expect(hold.added.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(hold.added.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
