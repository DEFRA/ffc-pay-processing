const { getSchemes, schemeDoesNotRequirePPAs } = require('ffc-pay-schemes')
const db = require('../../app/data')
const { addHoldType } = require('../../app/holds')
const {
  BANK_ACCOUNT_ANOMALY,
  DAX_REJECTION,
  AWAITING_DEBT_ENRICHMENT,
  AWAITING_LEDGER_CHECK
} = require('../../app/constants/hold-categories-names')

const { updateSchemesDatabase } = require('../../app/update-schemes-database')

jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn(),
  schemeDoesNotRequirePPAs: jest.fn()
}))

jest.mock('../../app/data', () => ({
  scheme: {
    upsert: jest.fn()
  }
}))

jest.mock('../../app/holds', () => ({
  addHoldType: jest.fn()
}))

describe('update schemes database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
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
    db.scheme.upsert.mockResolvedValue([{}, true])
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(db.scheme.upsert).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      name: scheme.schemeName,
      active: true
    })

    expect(addHoldType).toHaveBeenCalledWith(BANK_ACCOUNT_ANOMALY, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(DAX_REJECTION, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(AWAITING_DEBT_ENRICHMENT, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(AWAITING_LEDGER_CHECK, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledTimes(4)
  })

  test('should only create D365 holds for a new scheme not supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    db.scheme.upsert.mockResolvedValue([{}, true])
    schemeDoesNotRequirePPAs.mockReturnValue(true)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledWith(BANK_ACCOUNT_ANOMALY, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(DAX_REJECTION, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledTimes(2)
  })

  test('should not create holds for an existing scheme', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    db.scheme.upsert.mockResolvedValue([{}, false])

    await updateSchemesDatabase()

    expect(addHoldType).not.toHaveBeenCalled()
    expect(schemeDoesNotRequirePPAs).not.toHaveBeenCalled()
  })

  test('should update all supported schemes', async () => {
    const schemes = [
      { schemeId: 'scheme-one', schemeName: 'Scheme one' },
      { schemeId: 'scheme-two', schemeName: 'Scheme two' }
    ]

    getSchemes.mockReturnValue(schemes)
    db.scheme.upsert
      .mockResolvedValueOnce([{}, true])
      .mockResolvedValueOnce([{}, false])
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(db.scheme.upsert).toHaveBeenCalledTimes(2)
    expect(addHoldType).toHaveBeenCalledTimes(4)
  })
})
