const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock()

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close
}))

jest.mock('../../../app/auto-hold/get-hold-category-id')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../app/auto-hold/get-hold-category-id')
jest.mock('../../../app/auto-hold/hold-and-reschedule')
const { holdAndReschedule: mockHoldAndReschedule } = require('../../../app/auto-hold/hold-and-reschedule')

const { TOP_UP } = require('../../../app/constants/adjustment-types')

const { applyHold } = require('../../../app/auto-hold/apply-hold')
const paymentRequest = require('../../mocks/payment-requests/payment-request')

const holdCategoryId = 1

describe('apply hold', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryId.mockResolvedValue(holdCategoryId)
    mockHoldAndReschedule.mockResolvedValue(true)
  })

  test('should create database transaction', async () => {
    await applyHold(paymentRequest, TOP_UP)
    expect(mockDb.transaction).toHaveBeenCalledTimes(1)
  })

  test('should get hold category id from category', async () => {
    await applyHold(paymentRequest, TOP_UP)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(paymentRequest.schemeId, TOP_UP, mockDb.trx)
  })

  test('should hold and reschedule payment request', async () => {
    await applyHold(paymentRequest, TOP_UP)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(paymentRequest, holdCategoryId, mockDb.trx)
  })

  test('should commit transaction', async () => {
    await applyHold(paymentRequest, TOP_UP)
    expect(mockDb.trx.commit).toHaveBeenCalledTimes(1)
  })

  test('should rollback transaction if error thrown', async () => {
    mockHoldAndReschedule.mockImplementationOnce(async () => {
      throw new Error('Simulated error in holdAndReschedule')
    })
    try {
      await applyHold(paymentRequest, TOP_UP)
    } catch (error) {
      expect(error.message).toBe('Simulated error in holdAndReschedule')
      expect(mockDb.trx.rollback).toHaveBeenCalledTimes(1)
    }
  })
})
