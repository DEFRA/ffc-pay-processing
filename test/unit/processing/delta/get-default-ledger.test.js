const { AP, AR } = require('../../../../app/constants/ledgers')
const { getDefaultLedger } = require('../../../../app/processing/delta/get-default-ledger')

describe('get default ledger', () => {
  test.each([
    { value: 100, expected: AP, description: 'top up' },
    { value: -100, expected: AR, description: 'recovery' },
    { value: 0, expected: AP, description: 'zero value' }
  ])('should return $expected for $description', ({ value, expected }) => {
    const defaultLedger = getDefaultLedger(value)
    expect(defaultLedger).toBe(expected)
  })
})
