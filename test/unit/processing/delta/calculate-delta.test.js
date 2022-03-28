const { AP, AR } = require('../../../../app/ledgers')
const calculateDelta = require('../../../../app/processing/delta')

describe('calculate delta', () => {
  test('should calculate top up as single request', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 80
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(1)
  })

  test('should calculate top up as AP if all settled', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 80
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].ledger).toBe(AP)
  })

  test('should calculate top up as AR if outstanding values', () => {
    const paymentRequest = {
      ledger: AP,
      value: 80,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 80
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: -50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].ledger).toBe(AR)
  })

  test('should calculate top up value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 80
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].value).toBe(20)
  })

  test('should calculate top up line value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 80
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests[0].invoiceLines[0].value).toBe(20)
  })

  test('should calculate recovery as single request', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 200
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(1)
  })

  test('should calculate recovery as AR if all settled', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 200
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].ledger).toBe(AR)
  })

  test('should calculate recovery as AP if outstanding values', () => {
    const paymentRequest = {
      ledger: AP,
      value: 20,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 20
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 0,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].ledger).toBe(AP)
  })

  test('should calculate recovery value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 200
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].value).toBe(-100)
  })

  test('should calculate recovery line value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 200
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests[0].invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests[0].invoiceLines[0].value).toBe(-100)
  })

  test('should ledger split if outstanding AR', () => {
    const paymentRequest = {
      ledger: AP,
      value: 110,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: -50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.filter(x => x.ledger === AP).length).toBe(1)
    expect(updatedPaymentRequests.filter(x => x.ledger === AR).length).toBe(1)
  })

  test('should ledger split value if outstanding AR', () => {
    const paymentRequest = {
      ledger: AP,
      value: 110,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: -50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).value).toBe(10)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).value).toBe(50)
  })

  test('should ledger split line values if outstanding AR', () => {
    const paymentRequest = {
      ledger: AP,
      value: 110,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: -50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).invoiceLines[0].value).toBe(10)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).invoiceLines[0].value).toBe(50)
  })

  test('should ledger split if outstanding AP', () => {
    const paymentRequest = {
      ledger: AP,
      value: 90,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.filter(x => x.ledger === AP).length).toBe(1)
    expect(updatedPaymentRequests.filter(x => x.ledger === AR).length).toBe(1)
  })

  test('should ledger split value if outstanding AP', () => {
    const paymentRequest = {
      ledger: AP,
      value: 90,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).value).toBe(-50)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).value).toBe(-10)
  })

  test('should ledger split line values if outstanding AP', () => {
    const paymentRequest = {
      ledger: AP,
      value: 90,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 50
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests.find(x => x.ledger === AP).invoiceLines[0].value).toBe(-50)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).invoiceLines.length).toBe(1)
    expect(updatedPaymentRequests.find(x => x.ledger === AR).invoiceLines[0].value).toBe(-10)
  })

  test('should zero value split if net 0', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 75
      }, {
        schemeCode: '80002',
        fundCode: 'DRD10',
        description: 'G00',
        value: 25
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 25
      }, {
        schemeCode: '80002',
        fundCode: 'DRD10',
        description: 'G00',
        value: 75
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.filter(x => x.ledger === AP).length).toBe(2)
  })

  test('should zero value split lines if net 0', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 75
      }, {
        schemeCode: '80002',
        fundCode: 'DRD10',
        description: 'G00',
        value: 25
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: '80001',
        fundCode: 'DRD10',
        description: 'G00',
        value: 25
      }, {
        schemeCode: '80002',
        fundCode: 'DRD10',
        description: 'G00',
        value: 75
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP && x.invoiceLines[0].value === -50)).toBeDefined()
    expect(updatedPaymentRequests.find(x => x.ledger === AP && x.invoiceLines[0].value === 50)).toBeDefined()
  })
})
