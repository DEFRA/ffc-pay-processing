const {
  resetDatabase,
  closeDatabaseConnection,
  saveSchedule,
  savePaymentRequest,
  settlePaymentRequest,
  createAdjustmentPaymentRequest,
  createClosurePaymentRequest
} = require('../../../helpers')

const mockSendMessage = jest.fn()
jest.mock('ffc-messaging', () => ({
  MessageSender: jest.fn(() => ({
    sendMessage: mockSendMessage,
    closeConnection: jest.fn()
  }))
}))

const inProgressSchedule = require('../../../mocks/schedules/in-progress')
const { AR } = require('../../../../app/constants/ledgers')
const { RECOVERY } = require('../../../../app/constants/adjustment-types')
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

  describe('basic processing', () => {
    test('should process payment request and update schedule', async () => {
      const { scheduleId } = await saveSchedule(inProgressSchedule, paymentRequest)
      await processPaymentRequests()
      const updatedSchedule = await db.schedule.findByPk(scheduleId)
      expect(updatedSchedule.completed).not.toBeNull()
    })

    test('should create completed payment request and invoice lines', async () => {
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

      const completedInvoiceLines = await db.completedInvoiceLine.findAll()
      expect(completedInvoiceLines.length).toBe(paymentRequest.invoiceLines.length)
    })
  })

  describe('debt routing and holds', () => {
    beforeEach(async () => {
      settlePaymentRequest(paymentRequest)
      await savePaymentRequest(paymentRequest, true)
      paymentRequest.invoiceNumber = 'INV-001'
    })

    test('routes to debt queue if recovery and no debt data', async () => {
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      expect(mockSendMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: expect.stringContaining(`${PAYMENT_PAUSED_PREFIX}.debt`)
      }))
    })

    test('does not route if recovery with debt data', async () => {
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      recoveryRequest.debtType = IRREGULAR
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      expect(mockSendMessage).not.toBeCalled()
    })

    test('creates auto hold if no debt data', async () => {
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      const holds = await db.autoHold.findAll({ where: { frn: paymentRequest.frn, closed: null } })
      expect(holds.length).toBe(1)
    })
  })

  describe('manual ledger processing', () => {
    beforeEach(() => { processingConfig.useManualLedgerCheck = true })

    test('creates auto hold for delta < 0', async () => {
      settlePaymentRequest(paymentRequest)
      await savePaymentRequest(paymentRequest, true)
      paymentRequest.invoiceNumber = 'INV-001'
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      recoveryRequest.debtType = IRREGULAR
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      const holds = await db.autoHold.findAll({ where: { frn: paymentRequest.frn, closed: null } })
      expect(holds.length).toBe(1)
      expect(mockSendMessage).toBeCalled()
    })

    test('does not process manual ledger if useManualLedgerCheck is false', async () => {
      processingConfig.useManualLedgerCheck = false
      settlePaymentRequest(paymentRequest)
      await savePaymentRequest(paymentRequest, true)
      paymentRequest.invoiceNumber = 'INV-001'
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      recoveryRequest.debtType = IRREGULAR
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      const holds = await db.autoHold.findAll({ where: { frn: paymentRequest.frn, closed: null } })
      expect(holds.length).toBe(0)
      expect(mockSendMessage).not.toBeCalled()
    })
  })

  describe('scheme closures', () => {
    beforeEach(() => { processingConfig.handleSchemeClosures = true })

    test('does not create AR entries if closure date has passed', async () => {
      await savePaymentRequest(paymentRequest, true)
      paymentRequest.invoiceNumber = 'INV-001'
      await db.frnAgreementClosed.create(closureDBEntry)
      const closureRequest = createClosurePaymentRequest(paymentRequest)
      const { paymentRequestId } = await saveSchedule(inProgressSchedule, closureRequest)
      await processPaymentRequests()
      const completedAR = await db.completedPaymentRequest.findAll({
        where: { paymentRequestId, frn: paymentRequest.frn, marketingYear: paymentRequest.marketingYear, schemeId: paymentRequest.schemeId, ledger: AR }
      })
      expect(completedAR.length).toBe(0)
    })

    test('processes manual ledger if closure date is future', async () => {
      processingConfig.useManualLedgerCheck = true
      settlePaymentRequest(paymentRequest)
      await savePaymentRequest(paymentRequest, true)
      paymentRequest.invoiceNumber = 'INV-001'
      closureDBEntry.closureDate = FUTURE_DATE
      await db.frnAgreementClosed.create(closureDBEntry)
      const recoveryRequest = createAdjustmentPaymentRequest(paymentRequest, RECOVERY)
      recoveryRequest.debtType = IRREGULAR
      await saveSchedule(inProgressSchedule, recoveryRequest)
      await processPaymentRequests()
      expect(mockSendMessage).toBeCalled()
    })
  })
})
