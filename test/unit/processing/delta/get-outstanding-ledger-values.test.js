const { AP, AR } = require('../../../../app/constants/ledgers')
const { getOutstandingLedgerValues } = require('../../../../app/processing/delta/get-outstanding-ledger-values')

const createPaymentRequests = (requests) => {
  return requests.map(({ ledger, value, settledValue }) => ({ ledger, value, settledValue }))
}

describe('get outstanding ledger values', () => {
  test.each([
    {
      description: 'zero for both ledgers if fully settled',
      requests: [
        { ledger: AP, value: 100, settledValue: 100 },
        { ledger: AR, value: -100 },
        { ledger: AR, value: 100 }
      ],
      expected: { AP: 0, AR: 0, hasOutstanding: false }
    },
    {
      description: 'AP outstanding only',
      requests: [{ ledger: AP, value: 100, settledValue: 0 }],
      expected: { AP: 100, AR: 0 }
    },
    {
      description: 'AR outstanding only',
      requests: [
        { ledger: AP, value: 100, settledValue: 100 },
        { ledger: AR, value: -100 }
      ],
      expected: { AP: 0, AR: 100 }
    },
    {
      description: 'both ledgers outstanding',
      requests: [
        { ledger: AP, value: 100, settledValue: 0 },
        { ledger: AR, value: -100 }
      ],
      expected: { AP: 100, AR: 100 }
    },
    {
      description: 'both ledgers partially outstanding and multiple entries',
      requests: [
        { ledger: AP, value: 100, settledValue: 25 },
        { ledger: AR, value: -100 },
        { ledger: AP, value: 50, settledValue: 25 },
        { ledger: AR, value: -25 },
        { ledger: AR, value: 50 }
      ],
      expected: { AP: 100, AR: 75 }
    },
    {
      description: 'past AR reallocation and partially settled leads to zero',
      requests: [
        { ledger: AP, value: 100, settledValue: 50 },
        { ledger: AP, value: -50, settledValue: 0 }
      ],
      expected: { AP: 0, AR: 0 }
    }
  ])('$description', ({ requests, expected }) => {
    const outstandingLedgerValues = getOutstandingLedgerValues(createPaymentRequests(requests))
    expect(outstandingLedgerValues.AP).toBe(expected.AP)
    expect(outstandingLedgerValues.AR).toBe(expected.AR)
    if ('hasOutstanding' in expected) {
      expect(outstandingLedgerValues.hasOutstanding).toBe(expected.hasOutstanding)
    }
  })
})
