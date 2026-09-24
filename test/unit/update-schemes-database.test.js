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
    findOne: jest.fn(),
    upsert: jest.fn()
  },
  autoHoldCategory: {
    create: jest.fn()
  }
}))

jest.mock('../../app/holds', () => ({
  addHoldType: jest.fn()
}))

describe('update schemes database', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    db.scheme.upsert.mockResolvedValue()
    db.autoHoldCategory.create.mockResolvedValue()
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
    db.scheme.findOne.mockResolvedValue(null)
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledWith(BANK_ACCOUNT_ANOMALY, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledWith(DAX_REJECTION, scheme.schemeId)
    expect(addHoldType).toHaveBeenCalledTimes(2)

    expect(db.autoHoldCategory.create).toHaveBeenCalledWith({
      name: AWAITING_DEBT_ENRICHMENT,
      schemeId: scheme.schemeId
    })
    expect(db.autoHoldCategory.create).toHaveBeenCalledWith({
      name: AWAITING_LEDGER_CHECK,
      schemeId: scheme.schemeId
    })
    expect(db.autoHoldCategory.create).toHaveBeenCalledTimes(2)
  })

  test('should only create D365 holds for a new scheme not supporting PPAs', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    db.scheme.findOne.mockResolvedValue(null)
    schemeDoesNotRequirePPAs.mockReturnValue(true)

    await updateSchemesDatabase()

    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(db.autoHoldCategory.create).not.toHaveBeenCalled()
  })

  test('should not create holds for an existing scheme', async () => {
    const scheme = {
      schemeId: 'scheme-id',
      schemeName: 'Scheme name'
    }

    getSchemes.mockReturnValue([scheme])
    db.scheme.findOne.mockResolvedValue(scheme)

    await updateSchemesDatabase()

    expect(addHoldType).not.toHaveBeenCalled()
    expect(db.autoHoldCategory.create).not.toHaveBeenCalled()
    expect(schemeDoesNotRequirePPAs).not.toHaveBeenCalled()
  })

  test('should update all supported schemes', async () => {
    const schemes = [
      { schemeId: 'scheme-one', schemeName: 'Scheme one' },
      { schemeId: 'scheme-two', schemeName: 'Scheme two' }
    ]

    getSchemes.mockReturnValue(schemes)
    db.scheme.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(schemes[1])
    schemeDoesNotRequirePPAs.mockReturnValue(false)

    await updateSchemesDatabase()

    expect(db.scheme.findOne).toHaveBeenCalledTimes(2)
    expect(db.scheme.upsert).toHaveBeenCalledTimes(2)
    expect(addHoldType).toHaveBeenCalledTimes(2)
    expect(db.autoHoldCategory.create).toHaveBeenCalledTimes(2)
  })
})
