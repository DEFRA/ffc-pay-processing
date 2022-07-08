const { AP, AR } = require('../../../../app/ledgers')
const splitHybridSchedules = require('../../../../app/processing/split-hybrid-schedules')
const { QUARTERLY, SINGLE } = require('../../../../app/schedules')
const { LUMP_SUMS, SFI } = require('../../../../app/schemes')
const NO_SCHEDULE_CODE = '80121'
const SCHEDULE_CODE = '80000'

describe('split hybrid schedules', () => {
  test('should return no change if not SFI', () => {
    const paymentRequests = [{
      schemeId: LUMP_SUMS,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result).toStrictEqual(paymentRequests)
  })

  test('should return no change if only AR', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AR,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result).toStrictEqual(paymentRequests)
  })

  test('should return no change if only scheduled lines', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result).toStrictEqual(paymentRequests)
  })

  test('should return updated schedule if only no schedule lines', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(1)
    expect(result[0].schedule).toBe(SINGLE)
    expect(result[0].invoiceNumber).toBe('S0000001S0000001V001')
  })

  test('should split with correct schedules if has no schedule code', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(2)
    expect(result[0].schedule).toBe(QUARTERLY)
    expect(result[0].invoiceLines.length).toBe(1)
    expect(result[0].invoiceLines[0].schemeCode).toBe(SCHEDULE_CODE)
    expect(result[1].schedule).toBe(SINGLE)
    expect(result[1].invoiceLines.length).toBe(1)
    expect(result[1].invoiceLines[0].schemeCode).toBe(NO_SCHEDULE_CODE)
  })

  test('should update payment request values when splitting', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(2)
    expect(result[0].value).toBe(100)
    expect(result[1].value).toBe(100)
  })

  test('should update invoice numbers when splitting', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001S0000001V001',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(2)
    expect(result[0].invoiceNumber).toBe('S0000001CS0000001V01')
    expect(result[1].invoiceNumber).toBe('S0000001DS0000001V01')
  })

  test('should only split AP requests', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001AS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }, {
      schemeId: SFI,
      ledger: AR,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001BS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(3)
    expect(result[0].ledger).toBe(AR)
    expect(result[0].value).toBe(200)
    expect(result[1].ledger).toBe(AP)
    expect(result[1].value).toBe(100)
    expect(result[2].ledger).toBe(AP)
    expect(result[2].value).toBe(100)
  })

  test('should split multiple AP requests', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001AS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }, {
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001BS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result.length).toBe(4)
    expect(result[0].ledger).toBe(AP)
    expect(result[0].value).toBe(100)
    expect(result[1].ledger).toBe(AP)
    expect(result[1].value).toBe(100)
    expect(result[2].ledger).toBe(AP)
    expect(result[2].value).toBe(100)
    expect(result[3].ledger).toBe(AP)
    expect(result[3].value).toBe(100)
  })

  test('should update invoice numbers when multiple AP requests', () => {
    const paymentRequests = [{
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001AS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }, {
      schemeId: SFI,
      ledger: AP,
      schedule: QUARTERLY,
      value: 200,
      invoiceNumber: 'S0000001BS0000001V01',
      invoiceLines: [{
        schemeCode: SCHEDULE_CODE,
        value: 100
      }, {
        schemeCode: NO_SCHEDULE_CODE,
        value: 100
      }]
    }]
    const result = splitHybridSchedules(paymentRequests)
    expect(result[0].invoiceNumber).toBe('S0000001CS0000001V01')
    expect(result[1].invoiceNumber).toBe('S0000001DS0000001V01')
    expect(result[2].invoiceNumber).toBe('S0000001ES0000001V01')
    expect(result[3].invoiceNumber).toBe('S0000001FS0000001V01')
  })
})
