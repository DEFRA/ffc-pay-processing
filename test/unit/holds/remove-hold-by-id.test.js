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
const { removeHoldById } = require('../../../app/holds/remove-hold-by-id')

describe('removeHoldById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(undefined)
  })

  test('closes the hold and sends the updated hold in a removed event', async () => {
    const hold = { holdId: 1, frn: '1234567890', closed: new Date() }
    mockDb.builder.resolves(hold)

    await removeHoldById(1)

    expect(mockDb.builder.where).toHaveBeenCalledWith({ holdId: 1 })
    expect(mockDb.builder.update).toHaveBeenCalledWith({ closed: expect.any(Date) })
    expect(sendHoldEvent).toHaveBeenCalledWith(hold, REMOVED)
  })

  test('sends a null hold if the hold does not exist', async () => {
    await removeHoldById(999)

    expect(sendHoldEvent).toHaveBeenCalledWith(null, REMOVED)
  })
})
