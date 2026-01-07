const { BPS } = require('../../../../app/constants/schemes')
const { DOM00, DOM01, DOM10 } = require('../../../../app/constants/domestic-fund-codes')
const { applyBPSDualAccounting } = require('../../../../app/processing/dual-accounting/bps')

let paymentRequest
let previousPaymentRequests

const createInvoiceLine = (invoiceNumber = 1, value = 25000, fundCode = 'EGF00') => ({
  invoiceNumber,
  schemeCode: '10570',
  fundCode,
  description: 'G01 - Gross value of claim',
  value,
  deliveryBody: 'RP00',
  convergence: false
})

beforeEach(() => {
  jest.clearAllMocks()

  paymentRequest = {
    sourceSystem: 'BPS',
    deliveryBody: 'RP00',
    invoiceNumber: 'F0000002C0000002V001',
    frn: 1000000002,
    marketingYear: 2020,
    paymentRequestNumber: 1,
    contractNumber: 'C0000002',
    currency: 'GBP',
    dueDate: '01/12/2020',
    value: 25000,
    invoiceLines: [createInvoiceLine()],
    schemeId: BPS,
    agreementNumber: 'C0000002',
    ledger: 'AP'
  }

  previousPaymentRequests = [{
    sourceSystem: 'BPS',
    deliveryBody: 'RP00',
    invoiceNumber: 'F0000001C0000001V001',
    frn: 1000000001,
    marketingYear: 2020,
    paymentRequestNumber: 1,
    contractNumber: 'C0000001',
    currency: 'GBP',
    dueDate: '01/12/2020',
    value: 25000,
    invoiceLines: [createInvoiceLine(1, 25000, DOM00)],
    schemeId: BPS,
    agreementNumber: 'C0000001',
    ledger: 'AP'
  }]
})

describe('applyBPSDualAccounting', () => {
  const testCases = [
    { scheme: BPS, year: 2020, expected: DOM10, desc: 'BPS >= 2020' },
    { scheme: BPS, year: 2019, prevFundCode: DOM00, expected: DOM00, firstPayment: true, desc: 'BPS < 2020 first payment' },
    { scheme: BPS, year: 2019, prevFundCode: DOM00, expected: DOM00, firstPayment: false, desc: 'BPS < 2020 not first payment' },
    { scheme: BPS, year: 2019, prevFundCode: 'EGF00', expected: DOM01, firstPayment: false, desc: 'BPS < 2020 prev has no domestic fund code' }
  ]

  testCases.forEach(({ scheme, year, expected, prevFundCode, firstPayment }) => {
    test(`should apply fund code correctly for ${scheme} (${year}) - ${firstPayment ? 'first payment' : 'not first'}`, async () => {
      paymentRequest.schemeId = scheme
      paymentRequest.marketingYear = year

      if (!firstPayment) {
        previousPaymentRequests[0].marketingYear = year
        if (prevFundCode) { previousPaymentRequests[0].invoiceLines[0].fundCode = prevFundCode }
      } else {
        previousPaymentRequests = []
      }

      paymentRequest.invoiceLines[1] = createInvoiceLine(2, 0)

      await applyBPSDualAccounting(paymentRequest, previousPaymentRequests)

      for (const line of paymentRequest.invoiceLines) {
        if (!firstPayment && prevFundCode && prevFundCode !== DOM00 && year < 2020) {
          expect(line.fundCode).toBe(DOM01)
        } else if (!firstPayment && prevFundCode && prevFundCode === DOM00 && year < 2020) {
          expect(line.fundCode).toBe(prevFundCode)
        } else {
          expect(line.fundCode).toBe(expected)
        }
      }
    })
  })

  test('should handle previous payment requests with no invoice lines', async () => {
    paymentRequest.marketingYear = 2019
    previousPaymentRequests[0].marketingYear = 2019
    previousPaymentRequests[0].invoiceLines = []
    previousPaymentRequests[1] = { invoiceLines: [createInvoiceLine(1, 25000, DOM00)] }

    await applyBPSDualAccounting(paymentRequest, previousPaymentRequests)
    expect(paymentRequest.invoiceLines[0].fundCode).toBe(DOM00)
  })
})
