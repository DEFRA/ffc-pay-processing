const { SCHEME_CODE } = require('../../../../mocks/values/scheme-code')

const { DRD10, EXQ00 } = require('../../../../../app/constants/domestic-fund-codes')
const { ERD14 } = require('../../../../../app/constants/eu-fund-codes')
const { AP, AR } = require('../../../../../app/constants/ledgers')
const { G00 } = require('../../../../../app/constants/line-codes')
const { CS } = require('../../../../../app/constants/schemes')

const { calculateDelta } = require('../../../../../app/processing/delta/calculate-delta')

describe('calculate delta', () => {
  test('should calculate top up as single request', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 20
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 0,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 90
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AP,
      value: 50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 75
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
        value: 25
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 25
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
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
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 75
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
        value: 25
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 25
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
        value: 75
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    expect(updatedPaymentRequests.length).toBe(2)
    expect(updatedPaymentRequests.find(x => x.ledger === AP && x.invoiceLines[0].value === -50)).toBeDefined()
    expect(updatedPaymentRequests.find(x => x.ledger === AP && x.invoiceLines[0].value === 50)).toBeDefined()
  })

  test('should confirm netValue exist after calculate top up as single request', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests.length).toBe(1)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate top up as AP if all settled', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].ledger).toBe(AP)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate top up as AR if outstanding values ', () => {
    const paymentRequest = {
      ledger: AP,
      value: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: -50
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].ledger).toBe(AR)
    expect(deltaPaymentRequest.netValue).toBe(80)
  })

  test('should confirm netValue exist after calculate top up value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].value).toBe(20)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate top up line value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 80,
      settledValue: 80,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 80
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].invoiceLines.length).toBe(1)
    expect(completedPaymentRequests[0].invoiceLines[0].value).toBe(20)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate recovery as single request', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 200
      }]
    }]

    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests.length).toBe(1)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate recovery as AR if all settled', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 200
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].ledger).toBe(AR)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should confirm netValue exist after calculate recovery as AP if outstanding values', () => {
    const paymentRequest = {
      ledger: AP,
      value: 20,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 20
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 0,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].ledger).toBe(AP)
    expect(deltaPaymentRequest.netValue).toBe(20)
  })

  test('should confirm netValue exist after calculate recovery value', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 200,
      settledValue: 200,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 200
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests[0].value).toBe(-100)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should  confirm netValue exist after ledger split if outstanding AR', () => {
    const paymentRequest = {
      ledger: AP,
      value: 110,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 110
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 100
      }]
    }, {
      ledger: AR,
      value: -50,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: -50
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests.length).toBe(2)
    expect(completedPaymentRequests.filter(x => x.ledger === AP).length).toBe(1)
    expect(completedPaymentRequests.filter(x => x.ledger === AR).length).toBe(1)
    expect(deltaPaymentRequest.netValue).toBe(110)
  })

  test('should confirm netValue exist after zero value split if net 0', () => {
    const paymentRequest = {
      ledger: AP,
      value: 100,
      invoiceNumber: 'S12345678SIP123456V003',
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 75
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
        value: 25
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      value: 100,
      settledValue: 100,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: DRD10,
        description: G00,
        value: 25
      }, {
        schemeCode: '80002',
        fundCode: DRD10,
        description: G00,
        value: 75
      }]
    }]
    const calDeltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const { deltaPaymentRequest, completedPaymentRequests } = calDeltaPaymentRequest
    expect(completedPaymentRequests.length).toBe(2)
    expect(completedPaymentRequests.filter(x => x.ledger === AP).length).toBe(2)
    expect(deltaPaymentRequest.netValue).toBe(100)
  })

  test('should calculate CS first payment when 100% funded', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = []
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(10000)
    expect(calculatedInvoiceLines.length).toBe(1)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(10000)
  })

  test('should calculate CS first payment when 75% funded', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }]
    }
    const previousPaymentRequests = []
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(10000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(7500)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(2500)
  })

  test('should calculate CS first payment when 85% funded', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 8500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        convergence: true,
        description: G00,
        value: 1500
      }]
    }
    const previousPaymentRequests = []
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(10000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(8500)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(1500)
  })

  test('should calculate CS first payment when 85% and 75% funded', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 20000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 8500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        convergence: true,
        description: G00,
        value: 1500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }]
    }
    const previousPaymentRequests = []
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(20000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(16000)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(4000)
  })

  test('should calculate CS first payment when 100% funded with mixed convergence', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 20000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 10000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = []
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(20000)
    expect(calculatedInvoiceLines.length).toBe(1)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(20000)
  })

  test('should calculate CS top up when 100% funded with mixed convergence', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 30000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 15000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 15000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 20000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 10000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(10000)
    expect(calculatedInvoiceLines.length).toBe(1)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(10000)
  })

  test('should calculate CS recovery when all 100% funded', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 5000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 5000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-5000)
    expect(calculatedInvoiceLines.length).toBe(1)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-5000)
  })

  test('should calculate CS recovery when previous is 100% funded and current is 75%', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 5000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 3750
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 1250
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-5000)
    expect(calculatedInvoiceLines.length).toBe(1)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-5000)
  })

  test('should calculate CS recovery with mixed previous equal funding rates', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }, {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-10000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-8750)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(-1250)
  })

  test('should calculate CS recovery with mixed previous unequal funding rates', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 30000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 30000
      }]
    }, {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-10000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-28125)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(-1875)
  })

  test('should calculate CS recovery with mixed funding rates and mixed convergence', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 20000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        convergence: true,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 20000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        convergence: true,
        description: G00,
        value: 10000
      }]
    }, {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        convergence: true,
        description: G00,
        value: 8500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        convergence: true,
        description: G00,
        value: 1500
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-20000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-17500)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(-2500)
  })

  test('should calculate CS recovery with mixed previous funding rates and state aid', () => {
    const paymentRequest = {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        accountCode: SOS228,
        description: G00,
        value: 10000
      }]
    }
    const previousPaymentRequests = [{
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 10000
      }]
    }, {
      ledger: AP,
      schemeId: CS,
      value: 10000,
      invoiceLines: [{
        schemeCode: SCHEME_CODE,
        fundCode: ERD14,
        description: G00,
        value: 7500
      }, {
        schemeCode: SCHEME_CODE,
        fundCode: EXQ00,
        description: G00,
        value: 2500
      }]
    }]
    const deltaPaymentRequest = calculateDelta(paymentRequest, previousPaymentRequests)
    const updatedPaymentRequests = deltaPaymentRequest.completedPaymentRequests
    const calculatedInvoiceLines = updatedPaymentRequests[0].invoiceLines.filter(x => x.value !== 0)

    expect(updatedPaymentRequests[0].value).toBe(-10000)
    expect(calculatedInvoiceLines.length).toBe(2)
    expect(calculatedInvoiceLines[0].fundCode).toBe(ERD14)
    expect(calculatedInvoiceLines[0].value).toBe(-8750)
    expect(calculatedInvoiceLines[1].fundCode).toBe(EXQ00)
    expect(calculatedInvoiceLines[1].value).toBe(-1250)
  })
})
