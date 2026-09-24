const { createKnexMock } = require('../../helpers/mock-knex')

const mockDb = createKnexMock(['hold'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../../app/event')
const { sendHoldEvent } = require('../../../app/event')

const { REMOVED } = require('../../../app/constants/hold-statuses')
const { removeBulkHold } = require('../../../app/holds/remove-bulk-hold')

describe('removeBulkHold', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(undefined)
  })

  test('does not close a hold or send an event if no open hold exists', async () => {
    await removeBulkHold([1234567890], 1)

    expect(mockDb.builder.where).toHaveBeenCalledWith({ frn: 1234567890, holdCategoryId: 1, closed: null })
    expect(mockDb.builder.update).not.toHaveBeenCalled()
    expect(sendHoldEvent).not.toHaveBeenCalled()
  })

  test('closes each open hold and sends a removed event', async () => {
    const hold = { holdId: 1, frn: '1234567890', holdCategoryId: 1 }
    mockDb.builder.resolves(hold)

    await removeBulkHold([1234567890, 1234567891], 1)

    expect(mockDb.builder.update).toHaveBeenCalledTimes(2)
    expect(mockDb.builder.update).toHaveBeenCalledWith({ closed: expect.any(Date) })
    expect(sendHoldEvent).toHaveBeenCalledWith({ ...hold, closed: expect.any(Date) }, REMOVED)
  })
})
