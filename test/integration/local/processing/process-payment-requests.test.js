const db = require('../../../../app/data')
const config = require('../../../../app/config')
const processPaymentRequests = require('../../../../app/processing/process-payment-requests')
const moment = require('moment')
const { AP, AR } = require('../../../../app/ledgers')
const { IRREGULAR } = require('../../../../app/debt-types')
const { SFI } = require('../../../../app/schemes')
const { QUARTERLY } = require('../../../../app/schedules')
const mockSendMessage = jest.fn()
jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn().mockImplementation(() => {
      return {
        sendMessage: mockSendMessage,
        closeConnection: jest.fn()
      }
    })
  }
})
let paymentRequest
let schedule
let invoiceLine

describe('process payment requests', () => {
  beforeEach(async () => {
    config.useManualLedgerCheck = false
    jest.clearAllMocks()
    await db.sequelize.truncate({ cascade: true })

    await db.scheme.create({
      schemeId: 1,
      name: 'SFI',
      active: true
    })

    await db.accountCode.create({
      accountCodeId: 1,
      schemeId: 1,
      lineDescription: 'G00 - Gross value of claim',
      accountCodeAP: 'SOS273',
      accountCodeARIrr: 'SOS274',
      accountCodeARAdm: 'SOS275'
    })

    await db.accountCode.create({
      accountCodeId: 2,
      schemeId: 1,
      lineDescription: 'P24 - Over declaration reduction',
      accountCodeAP: 'SOS927',
      accountCodeARIrr: 'SOS928',
      accountCodeARAdm: 'SOS929'
    })

    await db.holdCategory.create({
      holdCategoryId: 1,
      schemeId: 1,
      name: 'Awaiting debt enrichment'
    })

    await db.holdCategory.create({
      holdCategoryId: 2,
      schemeId: 1,
      name: 'Manual ledger hold'
    })

    paymentRequest = {
      paymentRequestId: 1,
      schemeId: 1,
      frn: 1234567890,
      marketingYear: 2022,
      invoiceNumber: 'S12345678SIP123456V001',
      value: 100,
      paymentRequestNumber: 1,
      debtType: IRREGULAR
    }

    invoiceLine = {
      paymentRequestId: 1,
      description: 'G00 - Gross value of claim',
      schemeCode: '80001',
      fundCode: 'DRD10',
      value: 100
    }

    schedule = {
      scheduleId: 1,
      paymentRequestId: 1,
      planned: moment().subtract(1, 'day')
    }
  })

  afterAll(async () => {
    await db.sequelize.truncate({ cascade: true })
    await db.sequelize.close()
  })

  test('should process payment request and update schedule', async () => {
    await db.paymentRequest.create(paymentRequest)
    await db.invoiceLine.create(invoiceLine)
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const updatedSchedule = await db.schedule.findByPk(schedule.scheduleId)
    expect(updatedSchedule.completed).not.toBeNull()
  })

  test('should process payment request and created completed request', async () => {
    await db.paymentRequest.create(paymentRequest)
    await db.invoiceLine.create(invoiceLine)
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId: paymentRequest.paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId
      }
    })
    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process payment request and create completed invoice lines', async () => {
    await db.paymentRequest.create(paymentRequest)
    await db.invoiceLine.create(invoiceLine)
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        description: invoiceLine.description
      }
    })
    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should process top up request and created completed request', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 80
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 80
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId: paymentRequest.paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AP,
        value: 20
      }
    })

    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process top up request and created completed lines', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 80
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 80
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        value: 20
      }
    })

    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should process recovery request and create completed request', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId: paymentRequest.paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AR,
        value: -20
      }
    })

    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process recovery request and create completed lines', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        value: -20
      }
    })

    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should route original request to debt queue if recovery and no debt data', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = undefined
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    expect(mockSendMessage.mock.calls.length).toBe(1)
    expect(mockSendMessage.mock.calls[0][0].body.invoiceNumber).toBe(paymentRequest.invoiceNumber)
  })

  test('should not route original request to debt queue if recovery with debt data present', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    expect(mockSendMessage).not.toBeCalled()
  })

  test('should process recovery request and not create completed request if no debt data', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = undefined
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId: paymentRequest.paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AR,
        value: -20
      }
    })

    expect(completedPaymentRequests.length).toBe(0)
  })

  test('should process recovery request and create hold if no debt data', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = undefined
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const holds = await db.hold.findAll({
      where: {
        frn: paymentRequest.frn,
        holdCategoryId: 1,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
  })

  test('should process recovery request and keep scheduled if no debt data', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = undefined
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const outstandingSchedule = await db.schedule.findAll({
      where: {
        paymentRequestId: paymentRequest.paymentRequestId,
        completed: null
      }
    })

    expect(outstandingSchedule.length).toBe(1)
  })

  test('should not route original request to debt queue if top up', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 80
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 80
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = undefined
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    expect(mockSendMessage).not.toBeCalled()
  })

  test('should process manual ledger request and create hold if useManualLedgerCheck equals true when delta value is < 0', async () => {
    config.useManualLedgerCheck = true

    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.schemeId = SFI
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const holds = await db.hold.findAll({
      where: {
        frn: paymentRequest.frn,
        holdCategoryId: 2,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
    expect(mockSendMessage).toBeCalled()
  })

  test('should process manual ledger request and create hold if useManualLedgerCheck equals true when delta value is > 0  but there is existing completed <0 value', async () => {
    config.useManualLedgerCheck = true

    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.schemeId = SFI
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = -100
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 2
    paymentRequest.value = -100
    paymentRequest.settled = new Date(2022, 12, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = -100
    invoiceLine.completedPaymentRequestId = 2
    await db.completedInvoiceLine.create(invoiceLine)

    // Third payment request
    paymentRequest.schemeId = SFI
    paymentRequest.paymentRequestId = 3
    paymentRequest.paymentRequestNumber = 3
    paymentRequest.value = 300
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 3
    invoiceLine.value = 300
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 3
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const holds = await db.hold.findAll({
      where: {
        frn: paymentRequest.frn,
        holdCategoryId: 2,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
    expect(mockSendMessage).toBeCalled()
  })

  test('should process manual ledger request and create hold if useManualLedgerCheck equals true when delta value is > 0, there is existing completed payment but no existing completed payment value < 0 ', async () => {
    config.useManualLedgerCheck = true

    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.schemeId = SFI
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 200
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 2
    paymentRequest.value = 200
    paymentRequest.settled = new Date(2022, 12, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 200
    invoiceLine.completedPaymentRequestId = 2
    await db.completedInvoiceLine.create(invoiceLine)

    // Third payment request
    paymentRequest.schemeId = SFI
    paymentRequest.paymentRequestId = 3
    paymentRequest.paymentRequestNumber = 3
    paymentRequest.value = 500
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 3
    invoiceLine.value = 500
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 3
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const holds = await db.hold.findAll({
      where: {
        frn: paymentRequest.frn,
        holdCategoryId: 2,
        closed: null
      }
    })

    expect(holds.length).toBe(0)
    expect(mockSendMessage).not.toBeCalled()
  })

  test('should not process manual ledger request if useManualLedgerCheck equals false', async () => {
    config.useManualLedgerCheck = false

    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()
    const holds = await db.hold.findAll({
      where: {
        frn: paymentRequest.frn,
        holdCategoryId: 2,
        closed: null
      }
    })

    expect(holds.length).toBe(0)
    expect(mockSendMessage).not.toBeCalled()
  })

  test('should throw error with incorrect hold category', async () => {
    config.useManualLedgerCheck = true

    await db.holdCategory.update({ name: 'Incorrect category name' }, { where: { holdCategoryId: 2 } })

    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 120
    paymentRequest.settled = new Date(2022, 8, 4)
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 120
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 100
    paymentRequest.debtType = IRREGULAR
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 100
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)

    try {
      await processPaymentRequests()
    } catch (error) {
      expect(error.message).toBe('WHERE parameter "holdCategoryId" has invalid "undefined" value')
    }
  })

  test('should calculate recovery with multiple lines', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.schedule = QUARTERLY
    paymentRequest.dueDate = '09/11/2020'
    paymentRequest.ledger = AP
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 1988697
    paymentRequest.lastSettlement = new Date(2021, 8, 4)
    paymentRequest.settledValue = 994348
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 347910
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 695820
    invoiceLine.schemeCode = '80002'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 287532
    invoiceLine.schemeCode = '80004'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 99267
    invoiceLine.schemeCode = '80005'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 58168
    invoiceLine.schemeCode = '80006'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 50000
    invoiceLine.schemeCode = '80009'
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 889759
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 347910
    invoiceLine.schemeCode = '80001'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 695820
    invoiceLine.schemeCode = '80002'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 287532
    invoiceLine.schemeCode = '80004'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 99267
    invoiceLine.schemeCode = '80005'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 58168
    invoiceLine.schemeCode = '80006'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 50000
    invoiceLine.schemeCode = '80009'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -347910
    invoiceLine.schemeCode = '80001'
    invoiceLine.description = 'P24 - Over declaration reduction'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -695820
    invoiceLine.schemeCode = '80002'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -26880
    invoiceLine.schemeCode = '80004'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -18328
    invoiceLine.schemeCode = '80005'
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    const completedPaymentRequestAP = await db.completedPaymentRequest.findOne({ where: { paymentRequestId: 2, ledger: AP } })
    const completedPaymentRequestAR = await db.completedPaymentRequest.findOne({ where: { paymentRequestId: 2, ledger: AR } })
    const completedInvoiceLinesAP = await db.completedInvoiceLine.findAll({ where: { completedPaymentRequestId: completedPaymentRequestAP.completedPaymentRequestId } })
    const completedInvoiceLinesAR = await db.completedInvoiceLine.findAll({ where: { completedPaymentRequestId: completedPaymentRequestAR.completedPaymentRequestId } })
    const totalAP = completedInvoiceLinesAP.reduce((x, y) => x + y.value, 0)
    const totalAR = completedInvoiceLinesAR.reduce((x, y) => x + y.value, 0)
    expect(completedPaymentRequestAP.value).toBe(-994349)
    expect(completedPaymentRequestAR.value).toBe(-94589)
    expect(totalAP).toBe(-994349)
    expect(totalAR).toBe(-94589)
  })

  test('should calculate top up with multiple lines', async () => {
    // first payment request
    await db.paymentRequest.create(paymentRequest)
    paymentRequest.schedule = QUARTERLY
    paymentRequest.dueDate = '09/11/2020'
    paymentRequest.ledger = AP
    paymentRequest.completedPaymentRequestId = 1
    paymentRequest.value = 1988697
    paymentRequest.lastSettlement = new Date(2021, 8, 4)
    paymentRequest.settledValue = 994348
    await db.completedPaymentRequest.create(paymentRequest)
    invoiceLine.value = 347910
    invoiceLine.completedPaymentRequestId = 1
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 695820
    invoiceLine.schemeCode = '80002'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 287532
    invoiceLine.schemeCode = '80004'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 99267
    invoiceLine.schemeCode = '80005'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 58168
    invoiceLine.schemeCode = '80006'
    await db.completedInvoiceLine.create(invoiceLine)
    invoiceLine.value = 50000
    invoiceLine.schemeCode = '80009'
    await db.completedInvoiceLine.create(invoiceLine)

    // second payment request
    paymentRequest.paymentRequestId = 2
    paymentRequest.paymentRequestNumber = 2
    paymentRequest.value = 889759
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 2
    invoiceLine.value = 347910
    invoiceLine.schemeCode = '80001'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 695820
    invoiceLine.schemeCode = '80002'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 287532
    invoiceLine.schemeCode = '80004'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 99267
    invoiceLine.schemeCode = '80005'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 58168
    invoiceLine.schemeCode = '80006'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 50000
    invoiceLine.schemeCode = '80009'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -347910
    invoiceLine.schemeCode = '80001'
    invoiceLine.description = 'P24 - Over declaration reduction'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -695820
    invoiceLine.schemeCode = '80002'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -26880
    invoiceLine.schemeCode = '80004'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = -18328
    invoiceLine.schemeCode = '80005'
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    // third payment request
    paymentRequest.paymentRequestId = 3
    paymentRequest.paymentRequestNumber = 3
    paymentRequest.value = 889759
    await db.paymentRequest.create(paymentRequest)
    invoiceLine.paymentRequestId = 3
    invoiceLine.value = 347910
    invoiceLine.schemeCode = '80001'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 695820
    invoiceLine.schemeCode = '80002'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 287532
    invoiceLine.schemeCode = '80004'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 99267
    invoiceLine.schemeCode = '80005'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 58168
    invoiceLine.schemeCode = '80006'
    await db.invoiceLine.create(invoiceLine)
    invoiceLine.value = 50000
    invoiceLine.schemeCode = '80009'
    await db.invoiceLine.create(invoiceLine)
    schedule.paymentRequestId = 3
    schedule.scheduleId = 2
    await db.schedule.create(schedule)
    await processPaymentRequests()

    const completedPaymentRequestAP = await db.completedPaymentRequest.findOne({ where: { paymentRequestId: 3, ledger: AP } })
    const completedPaymentRequestAR = await db.completedPaymentRequest.findOne({ where: { paymentRequestId: 3, ledger: AR } })
    const completedInvoiceLinesAP = await db.completedInvoiceLine.findAll({ where: { completedPaymentRequestId: completedPaymentRequestAP.completedPaymentRequestId } })
    const completedInvoiceLinesAR = await db.completedInvoiceLine.findAll({ where: { completedPaymentRequestId: completedPaymentRequestAR.completedPaymentRequestId } })
    const totalAP = completedInvoiceLinesAP.reduce((x, y) => x + y.value, 0)
    const totalAR = completedInvoiceLinesAR.reduce((x, y) => x + y.value, 0)
    expect(completedPaymentRequestAP.value).toBe(994349)
    expect(completedPaymentRequestAR.value).toBe(94589)
    expect(totalAP).toBe(994349)
    expect(totalAR).toBe(94589)
  })
})
