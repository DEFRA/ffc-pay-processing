jest.mock('../../../app/settlement/get-settlement-filter')
jest.mock('../../../app/settlement/update-settlement-status')
jest.mock('../../../app/settlement/get-settlement-payment-request')
jest.mock('../../../app/event')

const { getSettlementFilter: mockGetSettlementFilter } = require('../../../app/settlement/get-settlement-filter')
const { updateSettlementStatus: mockUpdateSettlementStatus } = require('../../../app/settlement/update-settlement-status')
const { getSettlementPaymentRequest: mockGetSettlementPaymentRequest } = require('../../../app/settlement/get-settlement-payment-request')
const { sendProcessingReturnEvent: mockSendProcessingReturnEvent } = require('../../../app/event')

const { FRN } = require('../../mocks/values/frn')
const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')
const { processSettlement } = require('../../../app/settlement/process-settlement')

const mockSettlementFilter = { invoiceNumber: INVOICE_NUMBER }
const mockPaymentRequest = { frn: FRN, invoiceNumber: INVOICE_NUMBER, correlationId: 'correlation-id', schemeId: 1 }
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

let settlement

describe('processSettlement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy.mockClear()

    mockGetSettlementFilter.mockReturnValue(mockSettlementFilter)
    mockUpdateSettlementStatus.mockResolvedValue({ frn: FRN, invoiceNumber: INVOICE_NUMBER })
    mockGetSettlementPaymentRequest.mockResolvedValue(mockPaymentRequest)

    settlement = structuredClone(require('../../mocks/settlements/settlement'))
  })

  describe('when settlement is settled', () => {
    test('gets settlement filter and updates settlement status', async () => {
      await processSettlement(settlement)
      expect(mockGetSettlementFilter).toHaveBeenCalledWith(settlement)
      expect(mockUpdateSettlementStatus).toHaveBeenCalledWith(settlement, mockSettlementFilter)
    })

    test('sends processing return event and returns true if matched payment request', async () => {
      const result = await processSettlement(settlement)
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement)
      expect(result).toBe(true)
    })

    test('sends error event and returns false if no matched payment request', async () => {
      mockUpdateSettlementStatus.mockResolvedValue(false)
      const result = await processSettlement(settlement)
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true, undefined)
      expect(result).toBe(false)
    })

    test('does not look up payment request if no matched payment request', async () => {
      mockUpdateSettlementStatus.mockResolvedValue(false)
      await processSettlement(settlement)
      expect(mockGetSettlementPaymentRequest).not.toHaveBeenCalled()
    })

    test('logs error if sending processing return event fails', async () => {
      mockSendProcessingReturnEvent.mockRejectedValue(new Error('test error'))
      await processSettlement(settlement)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send processing return event:', expect.any(Error))
    })
  })

  describe('when settlement is not settled', () => {
    beforeEach(() => {
      settlement.settled = false
    })

    test('does not update settlement status', async () => {
      await processSettlement(settlement)
      expect(mockUpdateSettlementStatus).not.toHaveBeenCalled()
    })

    test('looks up payment request using settlement filter', async () => {
      await processSettlement(settlement)
      expect(mockGetSettlementFilter).toHaveBeenCalledWith(settlement)
      expect(mockGetSettlementPaymentRequest).toHaveBeenCalledWith(mockSettlementFilter)
    })

    test('sends error processing return event with payment request and returns false', async () => {
      const result = await processSettlement(settlement)
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true, mockPaymentRequest)
      expect(result).toBe(false)
    })

    test('sends error processing return event without payment request if lookup fails', async () => {
      mockGetSettlementPaymentRequest.mockRejectedValue(new Error('test error'))
      const result = await processSettlement(settlement)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to get payment request for unsettled settlement:', expect.any(Error))
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true, undefined)
      expect(result).toBe(false)
    })

    test('logs error if sending processing return event fails', async () => {
      mockSendProcessingReturnEvent.mockRejectedValue(new Error('test error'))
      await processSettlement(settlement)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send processing return event for unsettled settlement:',
        expect.any(Error)
      )
    })
  })
})
