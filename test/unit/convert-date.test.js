const { convertDateToDDMMYYYY } = require('../../app/convert-date')

describe('convertDateToDDMMYYYY', () => {
  test.each([
    [16, 10, 2020, '16/10/2020'],
    [16, 10, 20, '16/10/20'],
    [6, 10, 2020, '06/10/2020'],
    [16, 1, 2020, '16/01/2020'],
    [6, 1, 2020, '06/01/2020']
  ])('converts %i/%i/%i to %s', (day, month, year, expected) => {
    const result = convertDateToDDMMYYYY(day, month, year)
    expect(result).toBe(expected)
  })
})
