const mockCommit = jest.fn()
const mockRollback = jest.fn()
const mockTransactionObject = {
  commit: mockCommit,
  rollback: mockRollback
}
const mockTransaction = jest.fn().mockImplementation(() => {
  return mockTransactionObject
})

jest.mock('../../../app/data', () => {
  return {
    sequelize: {
      transaction: mockTransaction
    }
  }
})

jest.mock('../../../app/reset')
const { resetPaymentRequestById: mockResetPaymentRequestById } = require('../../../app/reset')

jest.mock('../../../app/acknowledgement/get-hold-category-name')
const { getHoldCategoryName: mockGetHoldCategoryName } = require('../../../app/acknowledgement/get-hold-category-name')

jest.mock('../../../app/holds')
const { getHoldCategoryId: mockGetHoldCategoryId } = require('../../../app/holds')

jest.mock('../../../app/reschedule')
const { holdAndReschedule: mockHoldAndReschedule } = require('../../../app/reschedule')

jest.mock('../../../app/event')
const { sendAcknowledgementErrorEvent: mockSendAcknowledgementErrorEvent } = require('../../../app/event')

const acknowledgement = require('../../mocks/acknowledgement')
const { FRN } = require('../../mocks/values/frn')

const { DAX_REJECTION } = require('../../../app/constants/hold-categories-names')
const { SFI } = require('../../../app/constants/schemes')

const { processInvalid } = require('../../../app/acknowledgement/process-invalid')

const PAYMENT_REQUEST_ID = 1
const HOLD_CATEGORY_ID = 1
const SOURCE_SYSTEM = 'sourceSystem'

describe('process invalid acknowledgements', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetHoldCategoryName.mockReturnValue(DAX_REJECTION)
    mockGetHoldCategoryId.mockResolvedValue(HOLD_CATEGORY_ID)
  })

  test('should create new database transaction', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  test('should reset payment request by id in transaction scope', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockResetPaymentRequestById).toHaveBeenCalledWith(PAYMENT_REQUEST_ID, mockTransactionObject)
  })

  test('should get hold category name from acknowledgement message', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockGetHoldCategoryName).toHaveBeenCalledWith(acknowledgement.message)
  })

  test('should get hold category id from scheme id and hold category name', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockGetHoldCategoryId).toHaveBeenCalledWith(SFI, DAX_REJECTION, mockTransactionObject)
  })

  test('should hold and reschedule payment request', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockHoldAndReschedule).toHaveBeenCalledWith(PAYMENT_REQUEST_ID, HOLD_CATEGORY_ID, FRN, mockTransactionObject)
  })

  test('should send acknowledgement error event', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockSendAcknowledgementErrorEvent).toHaveBeenCalledWith(DAX_REJECTION, acknowledgement, FRN, SOURCE_SYSTEM)
  })

  test('should commit transaction', async () => {
    await processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)
    expect(mockCommit).toHaveBeenCalledTimes(1)
  })

  test('should rollback transaction on error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('test error'))
    await expect(processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)).rejects.toThrow('test error')
    expect(mockRollback).toHaveBeenCalledTimes(1)
  })

  test('should throw error on error', async () => {
    mockHoldAndReschedule.mockRejectedValue(new Error('test error'))
    await expect(processInvalid(SFI, PAYMENT_REQUEST_ID, FRN, SOURCE_SYSTEM, acknowledgement)).rejects.toThrow('test error')
  })
})
