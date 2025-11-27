const { getInvoiceLines } = require('../../../../app/processing/delta/get-invoice-lines')
const { FUND_CODE } = require('../../../mocks/values/fund-code')

const createPaymentRequest = (lines) => ({ invoiceLines: lines.map(line => ({ ...line, fundCode: FUND_CODE })) })

describe('get invoice lines', () => {
  test.each([
    {
      description: 'keeps value for current request, inverts previous positive',
      currentLines: [{ schemeCode: '80001', value: 100 }],
      previousLines: [{ schemeCode: '80002', value: 100 }],
      expected: [{ schemeCode: '80001', value: 100 }, { schemeCode: '80002', value: -100 }]
    },
    {
      description: 'inverts previous negative value',
      currentLines: [{ schemeCode: '80001', value: 100 }],
      previousLines: [{ schemeCode: '80002', value: -100 }],
      expected: [{ schemeCode: '80001', value: 100 }, { schemeCode: '80002', value: 100 }]
    }
  ])('$description', ({ currentLines, previousLines, expected }) => {
    const paymentRequest = createPaymentRequest(currentLines)
    const previousPaymentRequests = [createPaymentRequest(previousLines)]

    const result = getInvoiceLines(paymentRequest, previousPaymentRequests)

    expected.forEach(({ schemeCode, value }) => {
      const line = result.find(x => x.schemeCode === schemeCode)
      expect(line.value).toBe(value)
    })
  })
})
