const moment = require('moment')
const { resetDatabase, closeDatabaseConnection, saveSchedule, savePaymentRequest } = require('../../../helpers')
const { FRN } = require('../../../mocks/values/frn')
const newSchedule = require('../../../mocks/schedules/new')
const futureSchedule = require('../../../mocks/schedules/future')
const completedSchedule = require('../../../mocks/schedules/completed')
const { SFI_PILOT, SFI } = require('../../../../app/constants/schemes')
const db = require('../../../../app/data')
const { processingConfig } = require('../../../../app/config')
const { getPaymentRequests } = require('../../../../app/processing/scheduled/get-payment-requests')

let paymentRequest
let hold

describe('get payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()
    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
    hold = { holdCategoryId: 1, frn: FRN, added: moment().subtract(1, 'day') }
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('returns empty array when no data or requests for scheme', async () => {
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('does not return requests if none scheduled or due', async () => {
    await savePaymentRequest(paymentRequest)
    await saveSchedule(futureSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('returns request if due', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('does not return request if invoice lines missing or invalid', async () => {
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.destroy({ where: { paymentRequestId } })
    let paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)

    await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.update({ invalid: true }, { where: { paymentRequestId } })
    paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('excludes only invalid invoice lines', async () => {
    paymentRequest.invoiceLines[1] = { ...paymentRequest.invoiceLines[0], description: 'invalid' }
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.update({ invalid: true }, { where: { paymentRequestId, description: 'invalid' } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests[0].paymentRequest.invoiceLines.length).toBe(1)
  })

  test('does not return request if scheme inactive', async () => {
    await db.scheme.update({ active: false }, { where: { schemeId: SFI } })
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test.each([
    ['already in progress', moment().subtract(1, 'minute'), 0],
    ['process time exceeded', moment().subtract(10, 'minute'), 1]
  ])('returns correct request when %s', async (_, started, expected) => {
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(expected)
  })

  test('does not return completed schedule', async () => {
    await saveSchedule(completedSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test.each([
    ['same agreement in process', 1, moment().subtract(1, 'minute'), 0],
    ['same agreement in process but time expired', 1, moment().subtract(10, 'minute'), 1]
  ])('returns correct request if %s', async (_, invoiceIndex, started, expected) => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(expected)
  })

  test.each([
    ['different scheme', SFI_PILOT, 1],
    ['different marketing year', SFI, 1, 2021],
    ['different customer', SFI, 1234567891, undefined]
  ])('returns request if another for same customer in process but %s', async (_, schemeId = SFI, frn = FRN, marketingYear) => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.schemeId = schemeId
    paymentRequest.frn = frn
    paymentRequest.invoiceNumber = 'INV-001'
    if (marketingYear) paymentRequest.marketingYear = marketingYear
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test.each([
    ['no holds', null, 1],
    ['hold expired', { closed: new Date() }, 1],
    ['hold for different customer', { frn: 234567891 }, 1],
    ['hold for different scheme', { holdCategoryId: 2 }, 1],
    ['frn on hold', {}, 0]
  ])('returns correct request when %s', async (_, holdOverrides, expected) => {
    await saveSchedule(newSchedule, paymentRequest)
    if (holdOverrides) Object.assign(hold, holdOverrides)
    if (!(expected === 1 && holdOverrides === null)) await db.hold.create(hold)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(expected)
  })

  test('removes duplicates for same agreement pending', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('preserves earliest request when duplicates', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ planned: moment().subtract(2, 'day') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests[0].paymentRequest.paymentRequestNumber).toBe(1)
  })

  test.each([
    ['different marketing year', 2021, 2],
    ['different customer', 1234567891, 2],
    ['different scheme', SFI_PILOT, 2]
  ])('does not remove pending for %s as duplicate', async (_, value, expected) => {
    await saveSchedule(newSchedule, paymentRequest)
    if (_ === 'different marketing year') paymentRequest.marketingYear = value
    if (_ === 'different customer') paymentRequest.frn = value
    if (_ === 'different scheme') paymentRequest.schemeId = value
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(expected)
  })

  test('process batch respects processing cap', async () => {
    processingConfig.processingCap = 10
    await saveSchedule(newSchedule, paymentRequest)

    for (let i = 2; i < 13; i++) {
      paymentRequest.frn = 1234567890 + i
      paymentRequest.invoiceNumber = 'INV-00' + i
      await saveSchedule(newSchedule, paymentRequest)
    }

    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(10)
  })

  test('process batch includes earliest schedules when capped', async () => {
    processingConfig.processingCap = 5
    const earlierDate = moment().subtract(2, 'day')
    const laterDate = moment().subtract(1, 'day')

    for (let i = 2; i < 14; i++) {
      paymentRequest.invoiceNumber = 'INV-00' + i
      const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
      await db.schedule.update({ planned: i % 2 === 0 ? earlierDate : laterDate }, { where: { scheduleId } })
    }

    const paymentRequests = await getPaymentRequests()
    paymentRequests.forEach(request => {
      expect(request.planned).toStrictEqual(earlierDate.toDate())
    })
  })

  test('updates schedule as started when request due', async () => {
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await getPaymentRequests()
    const updatedSchedule = await db.schedule.findByPk(scheduleId)
    expect(updatedSchedule.started).not.toBeNull()
  })

  test('updates only one schedule when duplicate requests', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    await getPaymentRequests()
    const updatedSchedules = await db.schedule.findAll({ where: { started: { [db.Sequelize.Op.ne]: null } } })
    expect(updatedSchedules.length).toBe(1)
  })
})
