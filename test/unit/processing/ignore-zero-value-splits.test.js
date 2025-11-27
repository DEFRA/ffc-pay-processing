const { AP, AR } = require('../../../app/constants/ledgers')
const { ignoreZeroValueSplits } = require('../../../app/processing/ignore-zero-value-splits')

describe('ignore zero value splits', () => {
  test('should return an empty array when passed an empty array', () => {
    expect(ignoreZeroValueSplits([])).toEqual([])
  })

  test('should remove all zero value pairs from the array', () => {
    const input = [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: -300 }
    ]

    const expected = [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 }
    ]

    expect(ignoreZeroValueSplits(input)).toEqual(expected)
  })

  const testCases = [
    ['no zero value pairs', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]],
    ['pair with different payment request numbers', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '123', ledger: AP, value: -100 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]],
    ['pair with different original invoice numbers', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '654', ledger: AP, value: -200 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]],
    ['pair with different ledgers', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AR, value: -200 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]],
    ['pair with AR ledger', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AR, value: 200 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AR, value: -200 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]],
    ['pair with non cancelling out values', [
      { paymentRequestNumber: 1, originalInvoiceNumber: '123', ledger: AP, value: 100 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: 200 },
      { paymentRequestNumber: 2, originalInvoiceNumber: '456', ledger: AP, value: -300 },
      { paymentRequestNumber: 3, originalInvoiceNumber: '789', ledger: AP, value: 300 }
    ]]
  ]

  test.each(testCases)('should not remove any elements if %s', (_desc, input) => {
    expect(ignoreZeroValueSplits(input)).toEqual(input)
  })
})
