const moment = require('moment')

const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

const db = require('../../../../app/data')

const { updateSettlementStatus } = require('../../../../app/settlement/update-settlement-status')
const { BPS, FDMR } = require('../../../../app/constants/schemes')
const { EUR } = require('../../../../app/constants/currency')

let settlement
let paymentRequest

describe('update settlement status', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()

    settlement = structuredClone(require('../../../mocks/settlements/settlement'))
    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
  })

  test('should return undefined if matching payment request not found', async () => {
    const result = await updateSettlementStatus(settlement)
    expect(result).toBeUndefined()
  })

  test('should update settled value if no previous settlements', async () => {
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  test('should update last settled date if no previous settlements', async () => {
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.lastSettlement).toStrictEqual(new Date(settlement.settlementDate))
  })

  test('should return invoice number and FRN if no previous settlements', async () => {
    await savePaymentRequest(paymentRequest, true)
    const result = await updateSettlementStatus(settlement)
    expect(result).toStrictEqual({ frn: paymentRequest.frn, invoiceNumber: paymentRequest.invoiceNumber })
  })

  test('should update settled value if previous settlement has earlier date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).subtract(1, 'day').toDate()
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  test('should update last settled date if previous settlement has earlier date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).subtract(1, 'day').toDate()
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.lastSettlement).toStrictEqual(new Date(settlement.settlementDate))
  })

  test('should return invoice number and FRN if previous settlement has earlier date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).subtract(1, 'day').toDate()
    await savePaymentRequest(paymentRequest, true)
    const result = await updateSettlementStatus(settlement)
    expect(result).toStrictEqual({ frn: paymentRequest.frn, invoiceNumber: paymentRequest.invoiceNumber })
  })

  test('should not update settled value if previous settlement has later date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).add(1, 'day').toDate()
    paymentRequest.settledValue = 50
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(paymentRequest.settledValue)
  })

  test('should not update last settled date if previous settlement has later date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).add(1, 'day').toDate()
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.lastSettlement).toStrictEqual(paymentRequest.lastSettlement)
  })

  test('should return invoice number and FRN if previous settlement has later date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).add(1, 'day').toDate()
    await savePaymentRequest(paymentRequest, true)
    const result = await updateSettlementStatus(settlement)
    expect(result).toStrictEqual({ frn: paymentRequest.frn, invoiceNumber: paymentRequest.invoiceNumber })
  })

  test('should not update settled value if previous settlement has same date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).toDate()
    paymentRequest.settledValue = 50
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(paymentRequest.settledValue)
  })

  test('should not update last settled date if previous settlement has same date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).toDate()
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.lastSettlement).toStrictEqual(paymentRequest.lastSettlement)
  })

  test('should return invoice number and frn if previous settlement has same date', async () => {
    paymentRequest.lastSettlement = moment(settlement.settlementDate).toDate()
    await savePaymentRequest(paymentRequest, true)
    const result = await updateSettlementStatus(settlement)
    expect(result).toStrictEqual({ frn: paymentRequest.frn, invoiceNumber: paymentRequest.invoiceNumber })
  })

  test.each([
    2015,
    2016,
    2017,
    2018,
    2019,
    2020
  ])('should update value to completed payment requests value if schemeId of completedPaymentRequest is BPS, settlement is GBP and marketing year prior to 2021', async (marketingYear) => {
    paymentRequest.schemeId = BPS
    paymentRequest.marketingYear = marketingYear
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(paymentRequest.value)
  })

  test.each([
    2021,
    2022,
    2023,
    2024
  ])('should update value to settlement value if schemeId of completedPaymentRequest is BPS, settlement is GBP and marketing year 2021 onwards', async (marketingYear) => {
    paymentRequest.schemeId = BPS
    paymentRequest.marketingYear = marketingYear
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  test.each([
    2015,
    2016,
    2017,
    2018,
    2019,
    2020
  ])('should update value to completed payment requests value if schemeId of completedPaymentRequest is FDMR, settlement is GBP and marketing year prior to 2021', async (marketingYear) => {
    paymentRequest.schemeId = FDMR
    paymentRequest.marketingYear = marketingYear
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(paymentRequest.value)
  })

  test.each([
    2021,
    2022,
    2023,
    2024
  ])('should update value to settlement value if schemeId of completedPaymentRequest is FDMR, settlement is GBP and marketing year 2021 onwards', async (marketingYear) => {
    paymentRequest.schemeId = FDMR
    paymentRequest.marketingYear = marketingYear
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  test.each([
    2015,
    2016,
    2017,
    2018,
    2019,
    2020
  ])('should update value to settlement value if schemeId of completedPaymentRequest is BPS, settlement is EUR and marketing year prior to 2021', async (marketingYear) => {
    paymentRequest.schemeId = BPS
    paymentRequest.marketingYear = marketingYear
    settlement.currency = EUR
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  test.each([
    2015,
    2016,
    2017,
    2018,
    2019,
    2020
  ])('should update value to settlement value if schemeId of completedPaymentRequest is FDMR, settlement is EUR and marketing year prior to 2021', async (marketingYear) => {
    paymentRequest.schemeId = FDMR
    paymentRequest.marketingYear = marketingYear
    settlement.currency = EUR
    await savePaymentRequest(paymentRequest, true)
    await updateSettlementStatus(settlement)
    const updatedPaymentRequest = await db.completedPaymentRequest.findOne({ where: { invoiceNumber: paymentRequest.invoiceNumber } })
    expect(updatedPaymentRequest.settledValue).toBe(settlement.value)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
