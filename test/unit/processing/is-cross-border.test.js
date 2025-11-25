const { CROSS_BORDER } = require('../../../app/constants/delivery-bodies')
const { isCrossBorder } = require('../../../app/processing/is-cross-border')

describe('is cross border', () => {
  test.each([
    { desc: 'single cross border line', lines: [{ deliveryBody: CROSS_BORDER }], expected: true },
    { desc: 'multiple cross border lines', lines: [{ deliveryBody: CROSS_BORDER }, { deliveryBody: CROSS_BORDER }], expected: true },
    { desc: 'at least one cross border line', lines: [{ deliveryBody: CROSS_BORDER }, { deliveryBody: 'Something else' }], expected: true },
    { desc: 'no cross border lines', lines: [{ deliveryBody: 'Something else' }], expected: false },
    { desc: 'empty lines array', lines: [], expected: false },
    { desc: 'lines undefined', lines: undefined, expected: false }
  ])('should return $expected if $desc', ({ lines, expected }) => {
    expect(isCrossBorder(lines)).toBe(expected)
  })
})
