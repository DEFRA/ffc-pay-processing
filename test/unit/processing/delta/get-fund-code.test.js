const { EGF00, ERD14 } = require('../../../../app/constants/eu-fund-codes')
const { EXQ00 } = require('../../../../app/constants/domestic-fund-codes')
const { getFundCode } = require('../../../../app/processing/delta/get-fund-code')

describe('get fund code', () => {
  test.each([
    { fundCode: EXQ00, domesticFundCode: 'domestic', stateAid: true, expected: EXQ00, description: 'existing EXQ00 with state aid' },
    { fundCode: EGF00, domesticFundCode: 'domestic', stateAid: false, expected: 'domestic', description: 'EGF00 replaced by domestic' },
    { fundCode: ERD14, domesticFundCode: 'domestic', stateAid: false, expected: 'domestic', description: 'ERD14 replaced by domestic' },
    { fundCode: EXQ00, domesticFundCode: 'domestic', stateAid: false, expected: 'domestic', description: 'EXQ00 replaced by domestic' }
  ])('should return correct fund code for $description', ({ fundCode, domesticFundCode, stateAid, expected }) => {
    const result = getFundCode(fundCode, domesticFundCode, stateAid)
    expect(result).toBe(expected)
  })
})
