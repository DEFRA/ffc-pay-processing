const db = require('../../../app/data')
const updateSettlementStatus = require('../../../app/settlement')
let scheme
let paymentRequest
let returnData

describe('update settlement status', () => {
  beforeEach(async () => {
    await db.sequelize.truncate({ cascade: true })

    scheme = {
      schemeId: 1,
      name: 'SFI',
      active: true
    }

    paymentRequest = {
      completedPaymentRequestId: 1,
      paymentRequestId: 1,
      schemeId: 1,
      frn: 1234567890,
      marketingYear: 2022,
      invoiceNumber: 'S12345678A123456V001'
    }

    returnData = {
      invoiceNumber: 'S12345678A123456V001',
      settled: true,
      value: 200,
      settlementDate: new Date(2021, 8, 2)
    }
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should add settlement date to settled', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.lastSettlement).toStrictEqual(new Date(2021, 8, 2))
  })

  test('should add settlement value to settled', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.settledValue).toBe(200)
  })

  test('should add settlement value to existing settled value', async () => {
    await db.scheme.create(scheme)
    paymentRequest.settledValue = 100
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.settledValue).toBe(200)
  })

  test('should not add settlement date if outstanding values', async () => {
    await db.scheme.create(scheme)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    returnData.settled = false
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.lastSettlement).toBeNull()
  })

  test('should not add settlement value to existing settled value if settlement date same as last settlement', async () => {
    await db.scheme.create(scheme)
    paymentRequest.settledValue = 100
    paymentRequest.lastSettlement = new Date(2021, 8, 2)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.settledValue).toBe(100)
  })

  test('should not add settlement value to existing settled value if settlement date before last settlement', async () => {
    await db.scheme.create(scheme)
    paymentRequest.settledValue = 100
    paymentRequest.lastSettlement = new Date(2021, 8, 3)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.settledValue).toBe(100)
  })

  test('should add settlement value to existing settled value if settlement date after last settlement', async () => {
    await db.scheme.create(scheme)
    paymentRequest.settledValue = 100
    paymentRequest.lastSettlement = new Date(2021, 8, 1)
    await db.paymentRequest.create(paymentRequest)
    await db.completedPaymentRequest.create(paymentRequest)
    await updateSettlementStatus(returnData)
    const updatedPaymentRequest = await db.completedPaymentRequest.findByPk(paymentRequest.paymentRequestId)
    expect(updatedPaymentRequest.settledValue).toBe(200)
  })
})
