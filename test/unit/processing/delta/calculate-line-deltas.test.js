const { AGREEMENT_NUMBER } = require('../../../mocks/values/agreement-number')
const { SCHEME_CODE } = require('../../../mocks/values/scheme-code')

const { createInvoiceLine } = require('../../../helpers/create-invoice-line')
const { calculateLineDeltas } = require('../../../../app/processing/delta/calculate-line-deltas')

describe('calculateLineDeltas', () => {
  describe('Delta calculation by scheme', () => {
    test('calculates delta for single group', () => {
      const invoiceLines = [10, -8].map(value => createInvoiceLine({ value }))
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.find(x => x.schemeCode === SCHEME_CODE).value).toBe(2)
    })

    test('calculates delta for multiple groups', () => {
      const invoiceLines = [
        createInvoiceLine({ value: 10 }),
        createInvoiceLine({ value: -8 }),
        createInvoiceLine({ schemeCode: '80002', value: 11 }),
        createInvoiceLine({ schemeCode: '80002', value: -7 })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.find(x => x.schemeCode === SCHEME_CODE).value).toBe(2)
      expect(deltas.find(x => x.schemeCode === '80002').value).toBe(4)
    })
  })

  describe('Agreement number handling', () => {
    test('uses default agreement number for undefined or null values', () => {
      const invoiceLines = [
        createInvoiceLine({ value: 10 }),
        createInvoiceLine({ value: -8, agreementNumber: undefined }),
        createInvoiceLine({ value: 11, agreementNumber: 'AgreementNumber2' }),
        createInvoiceLine({ value: -7, agreementNumber: 'AgreementNumber2' }),
        createInvoiceLine({ value: -5, agreementNumber: undefined })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.find(x => x.agreementNumber === AGREEMENT_NUMBER).value).toBe(-3)
      expect(deltas.find(x => x.agreementNumber === 'AgreementNumber2').value).toBe(4)
    })

    test('groups by agreement number', () => {
      const invoiceLines = [
        createInvoiceLine({ value: 10 }),
        createInvoiceLine({ value: -8 }),
        createInvoiceLine({ value: 11, agreementNumber: 'AgreementNumber2' }),
        createInvoiceLine({ value: -7, agreementNumber: 'AgreementNumber2' })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.find(x => x.agreementNumber === AGREEMENT_NUMBER).value).toBe(2)
      expect(deltas.find(x => x.agreementNumber === 'AgreementNumber2').value).toBe(4)
    })
  })

  describe('Convergence handling', () => {
    test.each([
      { input: true, expected: true },
      { input: false, expected: false },
      { input: undefined, expected: false },
      { input: null, expected: false }
    ])('calculates convergence correctly when input is %p', ({ input, expected }) => {
      const invoiceLines = [
        createInvoiceLine({ value: 10 }),
        createInvoiceLine({ value: -5, convergence: input }),
        createInvoiceLine({ value: -8 })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas[0].convergence).toBe(expected)
      expect(deltas[0].value).toBe(-3)
    })

    test('merges convergence correctly when mixed', () => {
      const invoiceLines = [
        createInvoiceLine({ value: 10, convergence: false }),
        createInvoiceLine({ value: -5, convergence: false }),
        createInvoiceLine({ value: -8, convergence: true })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.length).toBe(1)
      expect(deltas[0].value).toBe(-3)
      expect(deltas[0].convergence).toBe(true)
    })
  })

  describe('Marketing year handling', () => {
    test('groups calculations by marketing year', () => {
      const invoiceLines = [
        createInvoiceLine({ value: 10, marketingYear: 2018 }),
        createInvoiceLine({ value: -5, marketingYear: 2018 }),
        createInvoiceLine({ value: -8, marketingYear: 2019 })
      ]
      const deltas = calculateLineDeltas(invoiceLines, AGREEMENT_NUMBER)
      expect(deltas.find(x => x.marketingYear === 2018).value).toBe(5)
      expect(deltas.find(x => x.marketingYear === 2019).value).toBe(-8)
    })
  })
})
