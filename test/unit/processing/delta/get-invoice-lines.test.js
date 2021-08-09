const getInvoiceLines = require('../../../../app/processing/delta/get-invoice-lines')

describe('get invoice lines', () => {
  test('should keep value for current request', () => {
    const paymentRequest = {
      invoiceLines: [{
        schemeCode: '80001',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      invoiceLines: [{
        schemeCode: '80002',
        value: 100
      }]
    }]
    const invoiceLines = getInvoiceLines(paymentRequest, previousPaymentRequests)
    expect(invoiceLines.find(x => x.schemeCode === '80001').value).toBe(100)
  })

  test('should invert positive value for current request', () => {
    const paymentRequest = {
      invoiceLines: [{
        schemeCode: '80001',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      invoiceLines: [{
        schemeCode: '80002',
        value: 100
      }]
    }]
    const invoiceLines = getInvoiceLines(paymentRequest, previousPaymentRequests)
    expect(invoiceLines.find(x => x.schemeCode === '80002').value).toBe(-100)
  })

  test('should invert negative value for current request', () => {
    const paymentRequest = {
      invoiceLines: [{
        schemeCode: '80001',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      invoiceLines: [{
        schemeCode: '80002',
        value: -100
      }]
    }]
    const invoiceLines = getInvoiceLines(paymentRequest, previousPaymentRequests)
    expect(invoiceLines.find(x => x.schemeCode === '80002').value).toBe(100)
  })
})
