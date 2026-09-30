jest.mock('ffc-pay-schemes', () => ({
  getAccountCodeMap: jest.fn(),
  getSchemeIds: jest.fn(() => ({ MANUAL: 8, SFI: 1 }))
}))

jest.mock('../../../../app/processing/account-codes/get-line-code-from-description', () => ({
  getLineCodeFromDescription: jest.fn()
}))

jest.mock('../../../../app/processing/account-codes/get-codes-for-line', () => ({
  getCodesForLine: jest.fn()
}))

jest.mock('../../../../app/processing/account-codes/select-line-code', () => ({
  selectLineCode: jest.fn()
}))

const { getAccountCodeMap } = require('ffc-pay-schemes')
const { getLineCodeFromDescription } = require('../../../../app/processing/account-codes/get-line-code-from-description')
const { getCodesForLine } = require('../../../../app/processing/account-codes/get-codes-for-line')
const { selectLineCode } = require('../../../../app/processing/account-codes/select-line-code')
const { mapAccountCodes } = require('../../../../app/processing/account-codes')

describe('mapAccountCodes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns without mapping account codes for manual payments', () => {
    const paymentRequest = {
      schemeId: 8,
      invoiceLines: [
        { description: 'Manual line' }
      ]
    }

    const result = mapAccountCodes(paymentRequest)

    expect(result).toBeUndefined()
    expect(paymentRequest.invoiceLines[0].accountCode).toBeUndefined()
    expect(getAccountCodeMap).not.toHaveBeenCalled()
  })

  test('maps account codes for each invoice line', () => {
    const accountCodeMap = [
      { lineCode: 'LINE-1', code: 'ACCOUNT-1' },
      { lineCode: 'LINE-2', code: 'ACCOUNT-2' }
    ]

    const paymentRequest = {
      schemeId: 1,
      invoiceLines: [
        { description: 'First line' },
        { description: 'Second line' }
      ]
    }

    const firstCodes = { lineCode: 'LINE-1' }
    const secondCodes = { lineCode: 'LINE-2' }

    getAccountCodeMap.mockReturnValue(accountCodeMap)
    getLineCodeFromDescription
      .mockReturnValueOnce('LINE-1')
      .mockReturnValueOnce('LINE-2')
    getCodesForLine
      .mockReturnValueOnce(firstCodes)
      .mockReturnValueOnce(secondCodes)
    selectLineCode
      .mockReturnValueOnce('ACCOUNT-1')
      .mockReturnValueOnce('ACCOUNT-2')

    const result = mapAccountCodes(paymentRequest)

    expect(result).toBeUndefined()
    expect(getAccountCodeMap).toHaveBeenCalledWith(1)

    expect(getLineCodeFromDescription).toHaveBeenNthCalledWith(1, 'First line')
    expect(getLineCodeFromDescription).toHaveBeenNthCalledWith(2, 'Second line')

    expect(getCodesForLine).toHaveBeenNthCalledWith(
      1,
      1,
      'LINE-1',
      paymentRequest.invoiceLines[0],
      accountCodeMap
    )
    expect(getCodesForLine).toHaveBeenNthCalledWith(
      2,
      1,
      'LINE-2',
      paymentRequest.invoiceLines[1],
      accountCodeMap
    )

    expect(selectLineCode).toHaveBeenNthCalledWith(
      1,
      firstCodes,
      paymentRequest,
      paymentRequest.invoiceLines[0]
    )
    expect(selectLineCode).toHaveBeenNthCalledWith(
      2,
      secondCodes,
      paymentRequest,
      paymentRequest.invoiceLines[1]
    )

    expect(paymentRequest.invoiceLines).toEqual([
      { description: 'First line', accountCode: 'ACCOUNT-1' },
      { description: 'Second line', accountCode: 'ACCOUNT-2' }
    ])
  })

  test('maps an undefined account code when no matching code is selected', () => {
    const invoiceLine = {
      description: 'Unmatched line'
    }

    const paymentRequest = {
      schemeId: 1,
      invoiceLines: [invoiceLine]
    }

    getAccountCodeMap.mockReturnValue([])
    getLineCodeFromDescription.mockReturnValue('UNKNOWN')
    getCodesForLine.mockReturnValue(undefined)
    selectLineCode.mockReturnValue(undefined)

    mapAccountCodes(paymentRequest)

    expect(selectLineCode).toHaveBeenCalledWith(
      undefined,
      paymentRequest,
      invoiceLine
    )
    expect(invoiceLine.accountCode).toBeUndefined()
  })
})
