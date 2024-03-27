const { getTotalValue } = require('../../../app/auto-hold/get-total-value')

const paymentRequests = [{
  value: 1
}, {
  value: 2
}, {
  value: 3
}]

describe('get total value', () => {
  test('should return 0 if no payment requests', () => {
    const result = getTotalValue([])
    expect(result).toBe(0)
  })

  test('should return total value of payment requests', () => {
    const result = getTotalValue(paymentRequests)
    expect(result).toBe(6)
  })

  test('should return total value of payment requests if decimal', () => {
    const result = getTotalValue([{
      value: 1.5
    }, {
      value: 2.5
    }, {
      value: 3.5
    }])
    expect(result).toBe(7.5)
  })
})
