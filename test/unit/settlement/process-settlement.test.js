jest.mock('../../../app/settlement/get-settlement-filter')
jest.mock('../../../app/settlement/update-settlement-status')
jest.mock('../../../app/event')

const { getSettlementFilter: mockGetSettlementFilter } = require('../../../app/settlement/get-settlement-filter')
const { updateSettlementStatus: mockUpdateSettlementStatus } = require('../../../app/settlement/update-settlement-status')
const { sendProcessingReturnEvent: mockSendProcessingReturnEvent } = require('../../../app/event')

const { FRN } = require('../../mocks/values/frn')
const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')
const { processSettlement } = require('../../../app/settlement/process-settlement')

const mockSettlementFilter = { invoiceNumber: INVOICE_NUMBER }
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

let settlement

describe('processSettlement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy.mockClear()

    mockGetSettlementFilter.mockReturnValue(mockSettlementFilter)
    mockUpdateSettlementStatus.mockResolvedValue({ frn: FRN, invoiceNumber: INVOICE_NUMBER })

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
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true)
      expect(result).toBe(false)
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

    test('sends error processing return event and returns false', async () => {
      const result = await processSettlement(settlement)
      expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true)
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
