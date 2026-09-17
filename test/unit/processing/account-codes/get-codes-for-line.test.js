jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({ CS: 5 }))
}))

jest.mock('../../../../app/processing/is-capital', () => ({
  isCapital: jest.fn()
}))

const { getCodesForLine } = require('../../../../app/processing/account-codes/get-codes-for-line')
const { isCapital } = require('../../../../app/processing/is-capital')

describe('getCodesForLine', () => {
  const accountCodeMap = [
    { lineCode: 'LINE-1', stateAid: true, code: 'STATE-AID' },
    { lineCode: 'LINE-1', stateAid: false, capital: true, code: 'CAPITAL' },
    { lineCode: 'LINE-1', stateAid: false, revenue: true, code: 'REVENUE' },
    { lineCode: 'LINE-2', code: 'OTHER-SCHEME' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns the state aid account code for CS lines', () => {
    const invoiceLine = {
      stateAid: true,
      schemeCode: 'SCHEME'
    }

    const result = getCodesForLine(5, 'LINE-1', invoiceLine, accountCodeMap)

    expect(result).toEqual(accountCodeMap[0])
    expect(isCapital).not.toHaveBeenCalled()
  })

  test('returns the capital account code for capital CS lines', () => {
    isCapital.mockReturnValue(true)

    const invoiceLine = {
      stateAid: false,
      schemeCode: 'SCHEME'
    }

    const result = getCodesForLine(5, 'LINE-1', invoiceLine, accountCodeMap)

    expect(result).toEqual(accountCodeMap[1])
    expect(isCapital).toHaveBeenCalledWith('SCHEME')
  })

  test('returns the revenue account code for non-capital CS lines', () => {
    isCapital.mockReturnValue(false)

    const invoiceLine = {
      stateAid: false,
      schemeCode: 'SCHEME'
    }

    const result = getCodesForLine(5, 'LINE-1', invoiceLine, accountCodeMap)

    expect(result).toEqual(accountCodeMap[2])
    expect(isCapital).toHaveBeenCalledWith('SCHEME')
  })

  test('returns the matching line code for non-CS schemes', () => {
    const invoiceLine = {
      stateAid: false,
      schemeCode: 'SCHEME'
    }

    const result = getCodesForLine('OTHER-SCHEME', 'LINE-2', invoiceLine, accountCodeMap)

    expect(result).toEqual(accountCodeMap[3])
    expect(isCapital).not.toHaveBeenCalled()
  })

  test('returns undefined when no account code matches', () => {
    const invoiceLine = {
      stateAid: false,
      schemeCode: 'SCHEME'
    }

    const result = getCodesForLine(5, 'UNKNOWN', invoiceLine, accountCodeMap)

    expect(result).toBeUndefined()
  })
})
