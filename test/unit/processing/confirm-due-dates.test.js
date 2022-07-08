const { AP, AR } = require('../../../app/ledgers')
const confirmDueDates = require('../../../app/processing/confirm-due-dates')
const { QUARTERLY, THREE_DAY_QUARTERLY, MONTHLY } = require('../../../app/schedules')

let currentDate

describe('confirm due dates', () => {
  beforeEach(() => {
    currentDate = new Date(2022, 2, 14)
  })

  test('should return no change if no previous requests', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, undefined, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should return no change if no previous requests as empty array', () => {
    const paymentRequests = [{
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, [], currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should not update schedule when quarterly and no outstanding payments', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '15/03/2020',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 1000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should update schedule to cover remaining payments when quarterly and three remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 250
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q3')
  })

  test('should update schedule to cover remaining payments when quarterly and two remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q2')
  })

  test('should update schedule to cover remaining payments when quarterly and one remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/09/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 750
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q1')
  })

  test('should not update schedule when monthly and no outstanding payments', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2020',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '08/09/2020',
      schedule: MONTHLY,
      value: 1000,
      settledValue: 1000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2020')
    expect(confirmedPaymentRequests[0].schedule).toBe(MONTHLY)
  })

  test('should update schedule to cover remaining payments when monthly and all remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/04/2022',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 0
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe(MONTHLY)
  })

  test('should update schedule to cover remaining payments when monthly and eleven remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2022',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 100
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M11')
  })

  test('should update schedule to cover remaining payments when monthly and ten remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/02/2022',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 200
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M10')
  })

  test('should update schedule to cover remaining payments when monthly and nine remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/01/2022',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 300
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M9')
  })

  test('should update schedule to cover remaining payments when monthly and eight remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 400
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M8')
  })

  test('should update schedule to cover remaining payments when monthly and seven remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/11/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M7')
  })

  test('should update schedule to cover remaining payments when monthly and six remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/10/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 600
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M6')
  })

  test('should update schedule to cover remaining payments when monthly and five remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/09/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 700
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M5')
  })

  test('should update schedule to cover remaining payments when monthly and four remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/08/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 800
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M4')
  })

  test('should update schedule to cover remaining payments when monthly and three remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/07/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 900
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M3')
  })

  test('should update schedule to cover remaining payments when monthly and two remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/06/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 1000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M2')
  })

  test('should update schedule to cover remaining payments when monthly and one remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: MONTHLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/05/2021',
      schedule: MONTHLY,
      value: 1200,
      settledValue: 1100
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/04/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('M1')
  })

  test('should not update schedule when three day quarters and no outstanding payments', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '01/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 1000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(THREE_DAY_QUARTERLY)
  })

  test('should update schedule to cover remaining payments when three day quarters and three remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '12/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 250
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T3')
  })

  test('should update schedule to cover remaining payments when three day quarters and two remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '09/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T2')
  })

  test('should update schedule to cover remaining payments when three day quarters and one remaining', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '06/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 750
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T1')
  })

  test('should not update schedule when top up', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: 100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 0
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should not update schedule when AR ledger', () => {
    const paymentRequests = [{
      ledger: AR,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/04/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 0
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should use PR1 as schedule', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 250
    }, {
      paymentRequestNumber: 2,
      ledger: AP,
      dueDate: '10/04/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 250
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q3')
  })

  test('should update all negative AP', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }, {
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '09/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T2')
    expect(confirmedPaymentRequests[1].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[1].schedule).toBe('T2')
  })

  test('should update only negative AP when multiple', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }, {
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: 100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '09/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T2')
    expect(confirmedPaymentRequests[1].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[1].schedule).toBe(THREE_DAY_QUARTERLY)
  })

  test('should update only negative AP when also AR', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }, {
      ledger: AR,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '09/03/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('15/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T2')
    expect(confirmedPaymentRequests[1].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[1].schedule).toBe(THREE_DAY_QUARTERLY)
  })

  test('should throw error if invalid schedule', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: THREE_DAY_QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '09/03/2022',
      schedule: 'X4',
      value: 1000,
      settledValue: 500
    }]
    expect(() => confirmDueDates(paymentRequests, previousPaymentRequests)).toThrow()
  })

  test('should not update schedule when quarterly and no outstanding payments with BACS rejection', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 1250
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/11/2021')
    expect(confirmedPaymentRequests[0].schedule).toBe(QUARTERLY)
  })

  test('should update schedule to cover remaining payments when quarterly and three remaining with BACS rejection', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/03/2022',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 500
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q3')
  })

  test('should update schedule to cover remaining payments when quarterly and two remaining with BACS rejection', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 750
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q2')
  })

  test('should update schedule to cover remaining payments when quarterly and one remaining with BACS rejection', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/09/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 1000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q1')
  })

  test('should update schedule to cover remaining payments when multiple BACS rejection', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 2000
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q2')
  })

  test('should update schedule to cover remaining payments when previous top up', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 500
    }, {
      paymentRequestNumber: 2,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 100,
      settledValue: 50
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q2')
  })

  test('should update schedule to cover remaining payments when previous negative AP', () => {
    const paymentRequests = [{
      ledger: AP,
      dueDate: '09/11/2021',
      schedule: QUARTERLY,
      value: -100
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: 1000,
      settledValue: 500
    }, {
      paymentRequestNumber: 2,
      ledger: AP,
      dueDate: '10/12/2021',
      schedule: QUARTERLY,
      value: -400,
      settledValue: 0
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('10/06/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('Q2')
  })

  test('should update schedule to cover remaining payments when value needs to be rounded in schedule', () => {
    currentDate = new Date(2022, 2, 31)
    const paymentRequests = [{
      ledger: AP,
      dueDate: '28/02/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: -39565
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '28/02/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1031258,
      settledValue: 515629
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('06/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T2')
  })

  test('should update schedule to cover remaining payments when value needs to be rounded in schedule second scenario', () => {
    currentDate = new Date(2022, 2, 31)
    const paymentRequests = [{
      ledger: AP,
      dueDate: '28/02/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: -202028
    }]
    const previousPaymentRequests = [{
      paymentRequestNumber: 1,
      ledger: AP,
      dueDate: '28/02/2022',
      schedule: THREE_DAY_QUARTERLY,
      value: 1024467,
      settledValue: 768350
    }]
    const confirmedPaymentRequests = confirmDueDates(paymentRequests, previousPaymentRequests, currentDate)
    expect(confirmedPaymentRequests[0].dueDate).toBe('09/03/2022')
    expect(confirmedPaymentRequests[0].schedule).toBe('T1')
  })
})
