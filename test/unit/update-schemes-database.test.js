jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn(),
  schemeDoesNotRequirePPAs: jest.fn()
}))

const { createKnexMock, createQueryBuilder } = require('../helpers/mock-knex')

const mockDb = createKnexMock(['scheme', 'autoHoldCategory'])

jest.mock('../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../app/holds', () => ({
  addHoldType: jest.fn()
}))

const { getSchemes, schemeDoesNotRequirePPAs } = require('ffc-pay-schemes')
const { addHoldType } = require('../../app/holds')
const {
  BANK_ACCOUNT_ANOMALY,
  DAX_REJECTION,
  AWAITING_DEBT_ENRICHMENT,
  AWAITING_LEDGER_CHECK
} = require('../../app/constants/hold-categories-names')

const { updateSchemesDatabase } = require('../../app/update-schemes-database')

describe('update schemes database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    mockDb.builder.resolves(undefined)
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  test('should create required holds for a new scheme supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledWith(BANK_ACCOUNT_ANOMALY, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(DAX_REJECTION, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledTimes(2)

    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      name: AWAITING_DEBT_ENRICHMENT,
      schemeId: scheme.schemeId
    })
    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      name: AWAITING_LEDGER_CHECK,
      schemeId: scheme.schemeId
    })
  })

  test('should only create D365 holds for a new scheme not supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    schemeDoesNotRequirePPAs.mockReturnValue(true)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(mockDb.tables.autoHoldCategory).not.toHaveBeenCalled()
  })

  test('should not create holds for an existing scheme', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves(scheme)

    await updateSchemesDatabase()

    expect(addHoldType).not.toHaveBeenCalled()
    expect(mockDb.tables.autoHoldCategory).not.toHaveBeenCalled()
    expect(schemeDoesNotRequirePPAs).not.toHaveBeenCalled()
  })

  test('should update all supported schemes', async () => {
    const schemes = [
      { schemeId: 'scheme-one', schemeName: 'Scheme one' },
      { schemeId: 'scheme-two', schemeName: 'Scheme two' }
    ]

    getSchemes.mockReturnValue(schemes)
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    const builderNew = createQueryBuilder()
    builderNew.resolves(undefined)
    const builderExisting = createQueryBuilder()
    builderExisting.resolves(schemes[1])

    mockDb.tables.scheme
      .mockReturnValueOnce(builderNew)
      .mockReturnValueOnce(builderNew)
      .mockReturnValueOnce(builderExisting)
      .mockReturnValueOnce(builderExisting)

    await updateSchemesDatabase()

    expect(mockDb.tables.scheme).toHaveBeenCalledTimes(4)
    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(mockDb.tables.autoHoldCategory).toHaveBeenCalledTimes(2)
  })
})
