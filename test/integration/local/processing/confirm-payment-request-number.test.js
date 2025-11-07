const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const db = require('../../../../app/data')

const { confirmPaymentRequestNumber } = require('../../../../app/processing/confirm-payment-request-number')

let paymentRequest

describe('confirm payment request number', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should retain existing payment request number if no matches', async () => {
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber)
  })

  test('should retain existing payment request number if previous payment request has lower number', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 2
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber)
  })

  test('should increment payment request number if previous payment request equals number', async () => {
    await savePaymentRequest(paymentRequest, true)
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber + 1)
  })

  test('should increment payment request number if previous payment request has higher number', async () => {
    paymentRequest.paymentRequestNumber = 2
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.paymentRequestNumber = 1
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(3)
  })

  test('should increment payment request number if previous payment request has higher number and multiple matches', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invoiceNumber = 'INV-001'
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.invoiceNumber = 'INV-002'
    paymentRequest.paymentRequestNumber = 1
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(3)
  })

  test('should not include invalid payment requests', async () => {
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.invalid = true
    await db.completedPaymentRequest.create(paymentRequest)
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber)
  })

  test('should not include other schemes', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.schemeId = 2
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber)
  })

  test('should not include other marketing years', async () => {
    await savePaymentRequest(paymentRequest, true)
    paymentRequest.marketingYear = 2021
    const paymentRequestNumber = await confirmPaymentRequestNumber(paymentRequest)
    expect(paymentRequestNumber).toBe(paymentRequest.paymentRequestNumber)
  })
})
