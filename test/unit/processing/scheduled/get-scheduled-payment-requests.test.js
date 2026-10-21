const { createKnexMock, createQueryBuilder } = require('../../../helpers/mock-knex')

const mockDb = createKnexMock(['schedule', 'paymentRequest', 'invoiceLine', 'scheme'])

jest.mock('../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { processingConfig } = require('../../../../app/config')
const getScheduledPaymentRequestsQuery = require('../../../../app/constants/get-scheduled-payment-requests-query')
const { getScheduledPaymentRequests } = require('../../../../app/processing/scheduled/get-scheduled-payment-requests')

describe('getScheduledPaymentRequests', () => {
  let scheduleBuilder
  let paymentRequestBuilder
  let invoiceLineBuilder
  let schemeBuilder

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.trx.raw.mockResolvedValue({ rows: [{ scheduleId: 1 }, { scheduleId: 2 }] })

    scheduleBuilder = createQueryBuilder().resolves([
      { scheduleId: 1, paymentRequestId: 10 },
      { scheduleId: 2, paymentRequestId: 20 }
    ])
    paymentRequestBuilder = createQueryBuilder().resolves([
      { paymentRequestId: 10, schemeId: 1 },
      { paymentRequestId: 20, schemeId: 1 }
    ])
    invoiceLineBuilder = createQueryBuilder().resolves([{ invoiceLineId: 100, paymentRequestId: 10, value: 50 }])
    schemeBuilder = createQueryBuilder().resolves([{ schemeId: 1, name: 'SFI' }])

    mockDb.tables.schedule.mockReturnValue(scheduleBuilder)
    mockDb.tables.paymentRequest.mockReturnValue(paymentRequestBuilder)
    mockDb.tables.invoiceLine.mockReturnValue(invoiceLineBuilder)
    mockDb.tables.scheme.mockReturnValue(schemeBuilder)
  })

  test('claims schedules in a serializable transaction and commits it', async () => {
    await getScheduledPaymentRequests()

    expect(mockDb.transaction).toHaveBeenCalledWith(undefined, { isolationLevel: 'serializable' })
    expect(mockDb.trx.raw).toHaveBeenCalledWith(getScheduledPaymentRequestsQuery, { processingCap: processingConfig.processingCap })
    expect(mockDb.trx.commit).toHaveBeenCalledTimes(1)
    expect(mockDb.trx.rollback).not.toHaveBeenCalled()
  })

  test('loads the claimed schedules and their valid invoice lines', async () => {
    await getScheduledPaymentRequests()

    expect(scheduleBuilder.whereIn).toHaveBeenCalledWith('scheduleId', [1, 2])
    expect(paymentRequestBuilder.whereIn).toHaveBeenCalledWith('paymentRequestId', [10, 20])
    expect(invoiceLineBuilder.whereIn).toHaveBeenCalledWith('paymentRequestId', [10, 20])
    expect(invoiceLineBuilder.where).toHaveBeenCalledWith('invalid', '<>', true)
    expect(schemeBuilder.whereIn).toHaveBeenCalledWith('schemeId', [1])
  })

  test('returns schedules with their payment request, invoice lines and scheme', async () => {
    const result = await getScheduledPaymentRequests()

    expect(result).toEqual([{
      scheduleId: 1,
      paymentRequestId: 10,
      paymentRequest: {
        paymentRequestId: 10,
        schemeId: 1,
        invoiceLines: [{ invoiceLineId: 100, paymentRequestId: 10, value: 50 }],
        scheme: { schemeId: 1, name: 'SFI' }
      }
    }])
  })

  test('drops schedules whose payment request no longer exists', async () => {
    paymentRequestBuilder.resolves([{ paymentRequestId: 20, schemeId: 1 }])
    invoiceLineBuilder.resolves([{ invoiceLineId: 200, paymentRequestId: 20, value: 50 }])

    const result = await getScheduledPaymentRequests()

    expect(result.map(x => x.scheduleId)).toEqual([2])
  })

  test('returns a null scheme if the scheme does not exist', async () => {
    schemeBuilder.resolves([])

    const result = await getScheduledPaymentRequests()

    expect(result[0].paymentRequest.scheme).toBeNull()
  })

  test('rolls back and rethrows if claiming schedules fails', async () => {
    mockDb.trx.raw.mockRejectedValue(new Error('serialization failure'))

    await expect(getScheduledPaymentRequests()).rejects.toThrow('serialization failure')
    expect(mockDb.trx.rollback).toHaveBeenCalledTimes(1)
    expect(mockDb.trx.commit).not.toHaveBeenCalled()
  })
})
