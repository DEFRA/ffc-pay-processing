jest.mock('ffc-pay-schemes', () => ({
  getSchemeIds: jest.fn(() => ({
    SFI23: 12
  }))
}))

const { getFirstPaymentRequest } = require('../../../../app/processing/due-dates/get-first-payment-request')

describe('getFirstPaymentRequest', () => {
  test('returns the previous PR1 for non-SFI23 schemes', () => {
    const firstPaymentRequest = {
      paymentRequestNumber: 1,
      schemeId: 1,
      schedule: 'Q1',
      dueDate: '01/04/2024'
    }

    const result = getFirstPaymentRequest(
      [{ schemeId: 1 }],
      [firstPaymentRequest]
    )

    expect(result).toBe(firstPaymentRequest)
  })

  test('returns undefined for a non-SFI23 scheme when there is no previous PR1', () => {
    const result = getFirstPaymentRequest(
      [{ schemeId: 1 }],
      [{ paymentRequestNumber: 2 }]
    )

    expect(result).toBeUndefined()
  })

  test('returns the current payment request schedule for SFI23 PR1', () => {
    const paymentRequest = {
      schemeId: 12,
      paymentRequestNumber: 1,
      schedule: 'Q1',
      dueDate: '01/04/2023'
    }

    const result = getFirstPaymentRequest([paymentRequest], [])

    expect(result).toEqual({
      schedule: 'Q1',
      dueDate: '01/04/2023'
    })
  })

  test('returns the previous PR1 for SFI23 when there is no advance payment', () => {
    const firstPaymentRequest = {
      paymentRequestNumber: 1,
      schedule: 'Q1',
      dueDate: '01/04/2023'
    }

    const result = getFirstPaymentRequest(
      [{ schemeId: 12, paymentRequestNumber: 2 }],
      [firstPaymentRequest]
    )

    expect(result).toBe(firstPaymentRequest)
  })

  test('restores the full schedule when an unsettled 2023 advance payment exists', () => {
    const firstPaymentRequest = {
      paymentRequestNumber: 1,
      schedule: 'Q1',
      dueDate: '01/04/2023'
    }

    const advancePayment = {
      paymentRequestNumber: 0,
      settledValue: 0,
      dueDate: '01/01/2023'
    }

    const result = getFirstPaymentRequest(
      [{
        schemeId: 12,
        paymentRequestNumber: 2,
        dueDate: '01/04/2023'
      }],
      [firstPaymentRequest, advancePayment]
    )

    expect(result).toEqual({
      schedule: 'Q4',
      dueDate: '01/04/2023'
    })
  })

  test('returns the previous PR1 when the advance payment is settled', () => {
    const firstPaymentRequest = {
      paymentRequestNumber: 1,
      schedule: 'Q1',
      dueDate: '01/04/2023'
    }

    const advancePayment = {
      paymentRequestNumber: 0,
      settledValue: 100,
      dueDate: '01/01/2023'
    }

    const result = getFirstPaymentRequest(
      [{ schemeId: 12, paymentRequestNumber: 2 }],
      [firstPaymentRequest, advancePayment]
    )

    expect(result).toBe(firstPaymentRequest)
  })

  test('returns the previous PR1 when the advance payment is not from 2023', () => {
    const firstPaymentRequest = {
      paymentRequestNumber: 1,
      schedule: 'Q1',
      dueDate: '01/04/2024'
    }

    const advancePayment = {
      paymentRequestNumber: 0,
      dueDate: '01/01/2024'
    }

    const result = getFirstPaymentRequest(
      [{ schemeId: 12, paymentRequestNumber: 2 }],
      [firstPaymentRequest, advancePayment]
    )

    expect(result).toBe(firstPaymentRequest)
  })
})
