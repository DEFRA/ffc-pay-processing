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
let schedule
let hold

describe('get payment requests', () => {
  beforeEach(async () => {
    await resetDatabase()

    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))

    hold = {
      holdCategoryId: 1,
      frn: FRN,
      added: moment().subtract(1, 'day')
    }
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should not return any payment requests if no data', async () => {
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests if no requests for scheme', async () => {
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests if none scheduled', async () => {
    await savePaymentRequest(paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return any payment requests if none due', async () => {
    await saveSchedule(futureSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should return payment request if due', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return payment request if no invoice lines', async () => {
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.destroy({ where: { paymentRequestId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return payment request if all invoice lines invalid', async () => {
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.update({ invalid: true }, { where: { paymentRequestId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not include invalid invoice lines', async () => {
    paymentRequest.invoiceLines[1] = { ...paymentRequest.invoiceLines[0], description: 'invalid' }
    const { paymentRequestId } = await saveSchedule(newSchedule, paymentRequest)
    await db.invoiceLine.update({ invalid: true }, { where: { paymentRequestId, description: 'invalid' } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests[0].paymentRequest.invoiceLines.length).toBe(1)
  })

  test('should not return payment request if scheme inactive', async () => {
    await db.scheme.update({ active: false }, { where: { schemeId: SFI } })
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return payment request if already in progress', async () => {
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should return payment request if process time exceeded', async () => {
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(10, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return payment request if complete', async () => {
    await saveSchedule(completedSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should not return payment request if another for same agreement in process', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should return payment request if another for same agreement in process but time expired', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(10, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return payment request if another for same agreement in process but time expired if scheme inactive', async () => {
    await db.scheme.update({ active: false }, { where: { schemeId: SFI } })
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(10, 'minute') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should return payment request if another for same agreement completed', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(completedSchedule, paymentRequest)
    await db.schedule.create(schedule)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if another for same customer in process but different scheme', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.schemeId = SFI_PILOT
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    await db.schedule.create(schedule)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if another for same customer in process but different marketing year', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.marketingYear = 2021
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    await db.schedule.create(schedule)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if another for different customer in process', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.frn = 1234567891
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ started: moment().subtract(1, 'minute') }, { where: { scheduleId } })
    await db.schedule.create(schedule)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if scheme has hold category with no holds', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should not return payment request if frn on hold', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    await db.hold.create(hold)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(0)
  })

  test('should return payment request if hold expired', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    hold.closed = new Date()
    await db.hold.create(hold)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if hold for different customer', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    hold.frn = 234567891
    await db.hold.create(hold)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return payment request if hold for different scheme', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    hold.holdCategoryId = 2
    await db.hold.create(hold)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should remove duplicate payment request if another for same agreement pending', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(1)
  })

  test('should return first request if payment request if another for same agreement pending even if scheduled earlier', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.invoiceNumber = 'INV-001'
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await db.schedule.update({ planned: moment().subtract(2, 'day') }, { where: { scheduleId } })
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests[0].paymentRequest.paymentRequestNumber).toBe(1)
  })

  test('should not remove pending for same customer but different marketing year as duplicate', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.marketingYear = 2021
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(2)
  })

  test('should not remove pending for different customer as duplicate', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.frn = 1234567891
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(2)
  })

  test('should not remove pending for same customer but different scheme as duplicate', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.schemeId = SFI_PILOT
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    const paymentRequests = await getPaymentRequests()
    expect(paymentRequests.length).toBe(2)
  })

  test('process batch is capped at maximum', async () => {
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

  test('process batch includes earliest when capped', async () => {
    processingConfig.processingCap = 5

    const earlierDate = moment().subtract(2, 'day')
    const laterDate = moment().subtract(1, 'day')

    for (let i = 2; i < 14; i++) {
      paymentRequest.invoiceNumber = 'INV-00' + i
      const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
      if (i % 2 === 0) {
        await db.schedule.update({ planned: earlierDate }, { where: { scheduleId } })
      } else {
        await db.schedule.update({ planned: laterDate }, { where: { scheduleId } })
      }
    }

    const paymentRequests = await getPaymentRequests()
    for (const request of paymentRequests) {
      expect(request.planned).toStrictEqual(earlierDate.toDate())
    }
  })

  test('should update as processing started if payment request if due', async () => {
    const { scheduleId } = await saveSchedule(newSchedule, paymentRequest)
    await getPaymentRequests()
    const updatedSchedule = await db.schedule.findByPk(scheduleId)
    expect(updatedSchedule.started).not.toBeNull()
  })

  test('should update only valid if duplicate payment request if another for same agreement pending', async () => {
    await saveSchedule(newSchedule, paymentRequest)
    paymentRequest.invoiceNumber = 'INV-001'
    await saveSchedule(newSchedule, paymentRequest)
    await getPaymentRequests()
    const updatedSchedules = await db.schedule.findAll({ where: { started: { [db.Sequelize.Op.ne]: null } } })
    expect(updatedSchedules.length).toBe(1)
  })
})
