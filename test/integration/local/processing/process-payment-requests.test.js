const { resetDatabase, closeDatabaseConnection, saveSchedule, savePaymentRequest, settlePaymentRequest, createAdjustmentPaymentRequest, createClosurePaymentRequest } = require('../../../helpers')

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

const inProgressSchedule = require('../../../mocks/schedules/in-progress')

const { AP, AR } = require('../../../../app/constants/ledgers')
const { TOP_UP, RECOVERY } = require('../../../../app/constants/adjustment-types')
const { IRREGULAR } = require('../../../../app/constants/debt-types')
const { PAYMENT_PAUSED_PREFIX } = require('../../../../app/constants/events')
const { closureDBEntry } = require('../../../mocks/closure/closure-db-entry')

const { processingConfig } = require('../../../../app/config')
const db = require('../../../../app/data')

const { processPaymentRequests } = require('../../../../app/processing/process-payment-requests')
const { FUTURE_DATE } = require('../../../mocks/values/future-date')

let paymentRequest

describe('process payment requests', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    processingConfig.useManualLedgerCheck = false
    processingConfig.handleSchemeClosures = false
    await resetDatabase()

    paymentRequest = JSON.parse(JSON.stringify(require('../../../mocks/payment-requests/payment-request')))
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })

  test('should process payment request and update schedule', async () => {
    const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await processPaymentRequests()
    const updatedSchedule = await db.schedule.findByPk(scheduleId)
    expect(updatedSchedule.completed).not.toBeNull()
  })

  test('should process payment request and created completed request', async () => {
    const { paymentRequestId } = await saveSchedule(inProgressSchedule, paymentRequest)
    await processPaymentRequests()
    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId
      }
    })
    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process payment request and create completed invoice lines', async () => {
    await saveSchedule(inProgressSchedule, paymentRequest)
    await processPaymentRequests()
    const completedInvoiceLines = await db.completedInvoiceLine.findAll()
    expect(completedInvoiceLines.length).toBe(paymentRequest.invoiceLines.length)
  })

  test('should process top up request and create completed request', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const topUpPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, TOP_UP)
    const { paymentRequestId } = await saveSchedule(inProgressSchedule, topUpPaymentRequest)

    await processPaymentRequests()

    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AP,
        value: 50
      }
    })

    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process top up request and created completed lines', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const topUpPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, TOP_UP)
    await saveSchedule(inProgressSchedule, topUpPaymentRequest)

    await processPaymentRequests()

    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        value: 50
      }
    })

    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should process reduction request and create completed request', async () => {
    // first payment request
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    const { paymentRequestId } = await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AP,
        value: -50
      }
    })

    expect(completedPaymentRequests.length).toBe(1)
  })

  test('should process reduction request and create completed lines', async () => {
    // first payment request
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const completedInvoiceLines = await db.completedInvoiceLine.findAll({
      where: {
        value: -50
      }
    })

    expect(completedInvoiceLines.length).toBe(1)
  })

  test('should route original request to debt queue if recovery and no debt data', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: expect.stringContaining(`${PAYMENT_PAUSED_PREFIX}.debt`) }))
  })

  test('should not route original request to debt queue if recovery with debt data present', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    recoveryPaymentRequest.debtType = IRREGULAR
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).not.toBeCalled()
  })

  test('should process recovery request and not create completed request if no debt data', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        value: -50
      }
    })

    expect(completedPaymentRequests.length).toBe(0)
  })

  test('should process recovery request and create auto hold if no debt data', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const holds = await db.autoHold.findAll({
      where: {
        frn: paymentRequest.frn,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
  })

  test('should process recovery request and keep scheduled if no debt data', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    const { paymentRequestId } = await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const outstandingSchedule = await db.schedule.findAll({
      where: {
        paymentRequestId,
        completed: null
      }
    })

    expect(outstandingSchedule.length).toBe(1)
  })

  test('should not route original request to debt queue if top up', async () => {
    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const topUpPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, TOP_UP)
    await saveSchedule(inProgressSchedule, topUpPaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).not.toBeCalled()
  })

  test('should process manual ledger request and create auto hold if useManualLedgerCheck equals true when delta value is < 0', async () => {
    processingConfig.useManualLedgerCheck = true

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    recoveryPaymentRequest.debtType = IRREGULAR
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const holds = await db.autoHold.findAll({
      where: {
        frn: paymentRequest.frn,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
    expect(mockSendMessage).toBeCalled()
  })

  test('should process manual ledger request and create auto hold if useManualLedgerCheck equals true when delta value is > 0  but there is existing completed <0 value', async () => {
    processingConfig.useManualLedgerCheck = true

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    await savePaymentRequest(recoveryPaymentRequest, true)

    // third payment request
    const topUpPaymentRequest = createAdjustmentPaymentRequest(recoveryPaymentRequest, TOP_UP)
    await saveSchedule(inProgressSchedule, topUpPaymentRequest)

    await processPaymentRequests()

    const holds = await db.autoHold.findAll({
      where: {
        frn: paymentRequest.frn,
        closed: null
      }
    })

    expect(holds.length).toBe(1)
    expect(mockSendMessage).toBeCalled()
  })

  test('should not process manual ledger request if useManualLedgerCheck equals false', async () => {
    processingConfig.useManualLedgerCheck = false

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    recoveryPaymentRequest.debtType = IRREGULAR
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    const holds = await db.autoHold.findAll({
      where: {
        frn: paymentRequest.frn,
        closed: null
      }
    })

    expect(holds.length).toBe(0)
    expect(mockSendMessage).not.toBeCalled()
  })

  test('should not process manual ledger request if useManualLedgerCheck equals true when delta value is < 0, and handleSchemeClosures equals true and given closure date has passed', async () => {
    processingConfig.useManualLedgerCheck = true
    processingConfig.handleSchemeClosures = true

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // set up closures DB after initial payment has passed
    await db.frnAgreementClosed.create(closureDBEntry)

    // second payment request
    const closurePaymentRequest = createClosurePaymentRequest(paymentRequest)
    await saveSchedule(inProgressSchedule, closurePaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).not.toBeCalled()
  })

  test('should process manual ledger request if useManualLedgerCheck equals true when delta value is < 0, and handleSchemeClosures equals false', async () => {
    processingConfig.useManualLedgerCheck = true
    processingConfig.handleSchemeClosures = false

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // set up closures DB (should be ignored)
    await db.frnAgreementClosed.create(closureDBEntry)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    recoveryPaymentRequest.debtType = IRREGULAR
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).toBeCalled()
  })

  test('should process manual ledger request if useManualLedgerCheck equals true when delta value is < 0, and handleSchemeClosures equals true but given closure date has not passed', async () => {
    processingConfig.useManualLedgerCheck = true
    processingConfig.handleSchemeClosures = true

    // first payment request
    settlePaymentRequest(paymentRequest)
    await savePaymentRequest(paymentRequest, true)

    // set up closures DB - with future date
    closureDBEntry.closureDate = FUTURE_DATE
    await db.frnAgreementClosed.create(closureDBEntry)

    // second payment request
    const recoveryPaymentRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
    recoveryPaymentRequest.debtType = IRREGULAR
    await saveSchedule(inProgressSchedule, recoveryPaymentRequest)

    await processPaymentRequests()

    expect(mockSendMessage).toBeCalled()
  })

  test('should not create any AR entries to completedPaymentRequests if handleSchemeClosures equals true and closureDate is in the past', async () => {
    processingConfig.handleSchemeClosures = true

    // first payment request
    await savePaymentRequest(paymentRequest, true)

    // set up closures DB
    await db.frnAgreementClosed.create(closureDBEntry)

    // second payment request
    const closurePaymentRequest = createClosurePaymentRequest(paymentRequest)
    const { paymentRequestId } = await saveSchedule(inProgressSchedule, closurePaymentRequest)

    await processPaymentRequests()

    const completedPaymentRequests = await db.completedPaymentRequest.findAll({
      where: {
        paymentRequestId,
        frn: paymentRequest.frn,
        marketingYear: paymentRequest.marketingYear,
        schemeId: paymentRequest.schemeId,
        ledger: AR
      }
    })
    expect(completedPaymentRequests.length).toBe(0)
  })
})
