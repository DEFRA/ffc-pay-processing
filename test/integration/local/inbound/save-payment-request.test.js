const { resetDatabase, closeDatabaseConnection } = require('../../../helpers')

jest.mock('../../../../app/inbound/get-existing-payment-request')
const { getExistingPaymentRequest: mockGetExistingPaymentRequest } = require('../../../../app/inbound/get-existing-payment-request')

jest.mock('../../../../app/inbound/save-invoice-lines')
const { saveInvoiceLines: mockSaveInvoiceLines } = require('../../../../app/inbound/save-invoice-lines')

jest.mock('../../../../app/inbound/create-schedule')
const { createSchedule: mockCreateSchedule } = require('../../../../app/inbound/create-schedule')

jest.mock('../../../../app/event/send-duplicate-payment-event')
const { sendDuplicatePaymentEvent: mockSendDuplicatePaymentEvent } = require('../../../../app/event/send-duplicate-payment-event')

const db = require('../../../../app/data')

const transactionSpy = jest.spyOn(db.sequelize, 'transaction')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')

const { savePaymentRequest } = require('../../../../app/inbound/save-payment-request')

describe('save payment request', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    mockGetExistingPaymentRequest.mockResolvedValue(null)
  })

  test('should check if payment request exists with invoice number', async () => {
    await savePaymentRequest(paymentRequest)
    expect(mockGetExistingPaymentRequest).toHaveBeenCalledWith(paymentRequest.invoiceNumber, expect.anything())
  })

  test('should save payment request if not already exists', async () => {
    await savePaymentRequest(paymentRequest)
    const savedPaymentRequest = await db.paymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(savedPaymentRequest.invoiceNumber).toBe(paymentRequest.invoiceNumber)
  })

  test('should not save payment request if already exists', async () => {
    mockGetExistingPaymentRequest.mockResolvedValue(paymentRequest)
    await savePaymentRequest(paymentRequest)
    const savedPaymentRequest = await db.paymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(savedPaymentRequest).toBeNull()
  })

  test('should send duplicate payment event if already exists', async () => {
    const referenceId = '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c'
    mockGetExistingPaymentRequest.mockResolvedValue({ ...paymentRequest, referenceId })
    await savePaymentRequest(paymentRequest)
    expect(mockSendDuplicatePaymentEvent).toHaveBeenCalledWith(paymentRequest, referenceId)
  })

  test('should not send duplicate payment event if does not already exist', async () => {
    await savePaymentRequest(paymentRequest)
    expect(mockSendDuplicatePaymentEvent).not.toHaveBeenCalled()
  })

  test('should save invoice lines', async () => {
    await savePaymentRequest(paymentRequest)
    expect(mockSaveInvoiceLines).toHaveBeenCalledWith(paymentRequest.invoiceLines, expect.anything(), expect.anything())
  })

  test('should create schedule', async () => {
    await savePaymentRequest(paymentRequest)
    expect(mockCreateSchedule).toHaveBeenCalledTimes(1)
  })

  test('should create transaction', async () => {
    await savePaymentRequest(paymentRequest)
    expect(transactionSpy).toHaveBeenCalled()
  })

  test('should rollback transaction if error', async () => {
    mockSaveInvoiceLines.mockRejectedValue(new Error('Test error'))
    await expect(savePaymentRequest(paymentRequest)).rejects.toThrow('Test error')
    const savedPaymentRequest = await db.paymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(savedPaymentRequest).toBeNull()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
