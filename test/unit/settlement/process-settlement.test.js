jest.mock('../../../app/settlement/get-settlement-filter')
const { getSettlementFilter: mockGetSettlementFilter } = require('../../../app/settlement/get-settlement-filter')

jest.mock('../../../app/settlement/update-settlement-status')
const { updateSettlementStatus: mockUpdateSettlementStatus } = require('../../../app/settlement/update-settlement-status')

jest.mock('../../../app/event')
const { sendProcessingReturnEvent: mockSendProcessingReturnEvent } = require('../../../app/event')

const { FRN } = require('../../mocks/values/frn')
const { INVOICE_NUMBER } = require('../../mocks/values/invoice-number')

const { processSettlement } = require('../../../app/settlement/process-settlement')

const mockSettlementFilter = { invoiceNumber: INVOICE_NUMBER }

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

let settlement

describe('process settlement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy.mockClear()

    mockGetSettlementFilter.mockReturnValue(mockSettlementFilter)
    mockUpdateSettlementStatus.mockResolvedValue({ frn: FRN, invoiceNumber: INVOICE_NUMBER })

    settlement = JSON.parse(JSON.stringify(require('../../mocks/settlements/settlement')))
  })

  test('should get settlement filter for settlement', async () => {
    await processSettlement(settlement)
    expect(mockGetSettlementFilter).toHaveBeenCalledWith(settlement)
  })

  test('should update settlement status if settled', async () => {
    await processSettlement(settlement)
    expect(mockUpdateSettlementStatus).toHaveBeenCalledWith(settlement, mockSettlementFilter)
  })

  test('should send non-error processing return event if settled and has matched payment request', async () => {
    await processSettlement(settlement)
    expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement)
  })

  test('should return true if settled and has matched payment request', async () => {
    const result = await processSettlement(settlement)
    expect(result).toBe(true)
  })

  test('should send error processing return event if settled and has no matched payment request', async () => {
    mockUpdateSettlementStatus.mockResolvedValue(false)
    await processSettlement(settlement)
    expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true)
  })

  test('should return false if settled and has no matched payment request', async () => {
    mockUpdateSettlementStatus.mockResolvedValue(undefined)
    const result = await processSettlement(settlement)
    expect(result).toBe(false)
  })

  test('should send error processing return event if not settled', async () => {
    settlement.settled = false
    await processSettlement(settlement)
    expect(mockSendProcessingReturnEvent).toHaveBeenCalledWith(settlement, true)
  })

  test('should return false if not settled', async () => {
    settlement.settled = false
    const result = await processSettlement(settlement)
    expect(result).toBe(false)
  })

  test('should not update settlement status if not settled', async () => {
    settlement.settled = false
    await processSettlement(settlement)
    expect(mockUpdateSettlementStatus).not.toHaveBeenCalled()
  })

  test('should log error if sending processing return event fails for settled settlement', async () => {
    mockSendProcessingReturnEvent.mockRejectedValue(new Error('test error'))
    await processSettlement(settlement)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send processing return event:', expect.any(Error))
  })

  test('should log error if sending processing return event fails for unsettled settlement', async () => {
    settlement.settled = false
    mockSendProcessingReturnEvent.mockRejectedValue(new Error('test error'))
    await processSettlement(settlement)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to send processing return event for unsettled settlement:', expect.any(Error))
  })
})
