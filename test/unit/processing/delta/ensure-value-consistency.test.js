const { ensureValueConsistency } = require('../../../../app/processing/delta/assign-ledger/ensure-value-consistency')
const { createSimpleInvoiceLine } = require('../../../helpers/create-invoice-line')

describe('ensureValueConsistency', () => {
  test('does not change lines if total matches request value', () => {
    const paymentRequest = {
      value: 100,
      invoiceLines: [createSimpleInvoiceLine({ value: 99 }), createSimpleInvoiceLine({ value: 1 })]
    }

    ensureValueConsistency(paymentRequest)

    expect(paymentRequest.invoiceLines[0].value).toBe(99)
    expect(paymentRequest.invoiceLines[1].value).toBe(1)
  })

  test.each([
    {
      name: 'adjusts first gross line if value inconsistent',
      invoiceLines: [createSimpleInvoiceLine({ value: 98 }), createSimpleInvoiceLine({ value: 1 })],
      expected: [99, 1]
    },
    {
      name: 'adjusts first gross line if value inconsistent with penalties',
      invoiceLines: [createSimpleInvoiceLine({ value: 97 }), createSimpleInvoiceLine({ description: 'P02', value: -1 }), createSimpleInvoiceLine({ value: 1 })],
      expected: [100, -1, 1]
    },
    {
      name: 'adjusts first line if value inconsistent and no gross lines',
      invoiceLines: [createSimpleInvoiceLine({ description: 'P25', value: 98 }), createSimpleInvoiceLine({ description: 'P25', value: 1 })],
      expected: [99, 1]
    }
  ])('$name', ({ invoiceLines, expected }) => {
    const paymentRequest = {
      value: 100,
      invoiceLines
    }

    ensureValueConsistency(paymentRequest)

    invoiceLines.forEach((line, i) => {
      expect(line.value).toBe(expected[i])
    })
  })
})
