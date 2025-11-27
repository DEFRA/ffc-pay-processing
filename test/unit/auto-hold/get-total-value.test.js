const { getTotalValue } = require('../../../app/auto-hold/get-total-value')

describe('get total value', () => {
  test('returns 0 when no payment requests', () => {
    expect(getTotalValue([])).toBe(0)
  })

  test.each([
    ['integer values', [{ value: 1 }, { value: 2 }, { value: 3 }], 6],
    ['decimal values', [{ value: 1.5 }, { value: 2.5 }, { value: 3.5 }], 7.5]
  ])('returns correct total for %s', (_, paymentRequests, expected) => {
    expect(getTotalValue(paymentRequests)).toBe(expected)
  })
})
