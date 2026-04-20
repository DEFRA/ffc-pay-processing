const { removeAgreementData } = require('../../../app/retention')
const db = require('../../../app/data')

jest.mock('../../../app/data', () => ({
  sequelize: {
    transaction: jest.fn()
  }
}))

jest.mock('../../../app/retention/find-completed-payment-requests', () => ({
  findCompletedPaymentRequests: jest.fn()
}))
jest.mock('../../../app/retention/find-payment-requests', () => ({
  findPaymentRequests: jest.fn()
}))
jest.mock('../../../app/retention/remove-completed-invoice-lines', () => ({
  removeCompletedInvoiceLines: jest.fn()
}))
jest.mock('../../../app/retention/remove-completed-payment-requests', () => ({
  removeCompletedPaymentRequests: jest.fn()
}))
jest.mock('../../../app/retention/remove-frn-agreement-closed', () => ({
  removeFRNAgreementClosed: jest.fn()
}))
jest.mock('../../../app/retention/remove-invoice-lines', () => ({
  removeInvoiceLines: jest.fn()
}))
jest.mock('../../../app/retention/remove-outbox', () => ({
  removeOutbox: jest.fn()
}))
jest.mock('../../../app/retention/remove-payment-requests', () => ({
  removePaymentRequests: jest.fn()
}))
jest.mock('../../../app/retention/remove-schedules', () => ({
  removeSchedules: jest.fn()
}))

const {
  findCompletedPaymentRequests
} = require('../../../app/retention/find-completed-payment-requests')
const {
  findPaymentRequests
} = require('../../../app/retention/find-payment-requests')
const {
  removeCompletedInvoiceLines
} = require('../../../app/retention/remove-completed-invoice-lines')
const {
  removeCompletedPaymentRequests
} = require('../../../app/retention/remove-completed-payment-requests')
const {
  removeFRNAgreementClosed
} = require('../../../app/retention/remove-frn-agreement-closed')
const {
  removeInvoiceLines
} = require('../../../app/retention/remove-invoice-lines')
const {
  removeOutbox
} = require('../../../app/retention/remove-outbox')
const {
  removePaymentRequests
} = require('../../../app/retention/remove-payment-requests')
const {
  removeSchedules
} = require('../../../app/retention/remove-schedules')

describe('removeAgreementData', () => {
  const retentionData = {
    agreementNumber: 'AGR123',
    frn: 456789,
    schemeId: 10,
    usesContractNumber: true
  }
  let transaction

  beforeEach(() => {
    jest.clearAllMocks()

    transaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    }
    db.sequelize.transaction.mockResolvedValue(transaction)
  })

  test('commits transaction and returns early if no payment requests found', async () => {
    findPaymentRequests.mockResolvedValue([])
    removeFRNAgreementClosed.mockResolvedValue()

    await removeAgreementData(retentionData)

    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1)
    expect(removeFRNAgreementClosed).toHaveBeenCalledWith(
      retentionData.agreementNumber,
      retentionData.frn,
      retentionData.schemeId,
      transaction
    )
    expect(findPaymentRequests).toHaveBeenCalledWith(
      retentionData.agreementNumber,
      retentionData.frn,
      retentionData.schemeId,
      retentionData.usesContractNumber,
      transaction
    )
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
  })

  test('removes completed payment requests and related data when completedPaymentRequestIds exist', async () => {
    const paymentRequests = [
      { paymentRequestId: 1 },
      { paymentRequestId: 2 }
    ]
    const completedPaymentRequests = [
      { completedPaymentRequestId: 101 },
      { completedPaymentRequestId: 102 }
    ]

    findPaymentRequests.mockResolvedValue(paymentRequests)
    findCompletedPaymentRequests.mockResolvedValue(completedPaymentRequests)
    removeFRNAgreementClosed.mockResolvedValue()
    removeOutbox.mockResolvedValue()
    removeCompletedInvoiceLines.mockResolvedValue()
    removeCompletedPaymentRequests.mockResolvedValue()
    removeSchedules.mockResolvedValue()
    removeInvoiceLines.mockResolvedValue()
    removePaymentRequests.mockResolvedValue()

    await removeAgreementData(retentionData)

    expect(db.sequelize.transaction).toHaveBeenCalledTimes(1)
    expect(removeFRNAgreementClosed).toHaveBeenCalledWith(
      retentionData.agreementNumber,
      retentionData.frn,
      retentionData.schemeId,
      transaction
    )
    expect(findPaymentRequests).toHaveBeenCalledWith(
      retentionData.agreementNumber,
      retentionData.frn,
      retentionData.schemeId,
      retentionData.usesContractNumber,
      transaction
    )
    expect(findCompletedPaymentRequests).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(removeOutbox).toHaveBeenCalledWith(
      [101, 102],
      transaction
    )
    expect(removeCompletedInvoiceLines).toHaveBeenCalledWith(
      [101, 102],
      transaction
    )
    expect(removeCompletedPaymentRequests).toHaveBeenCalledWith(
      [101, 102],
      transaction
    )
    expect(removeSchedules).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(removeInvoiceLines).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(removePaymentRequests).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
  })

  test('skips removing completed payment requests when none found but proceeds with other removals', async () => {
    const paymentRequests = [
      { paymentRequestId: 1 },
      { paymentRequestId: 2 }
    ]
    findPaymentRequests.mockResolvedValue(paymentRequests)
    findCompletedPaymentRequests.mockResolvedValue([])
    removeFRNAgreementClosed.mockResolvedValue()
    removeSchedules.mockResolvedValue()
    removeInvoiceLines.mockResolvedValue()
    removePaymentRequests.mockResolvedValue()

    await removeAgreementData(retentionData)

    expect(findCompletedPaymentRequests).toHaveBeenCalledWith(
      [1, 2],
      expect.anything()
    )
    expect(removeOutbox).not.toHaveBeenCalled()
    expect(removeCompletedInvoiceLines).not.toHaveBeenCalled()
    expect(removeCompletedPaymentRequests).not.toHaveBeenCalled()

    expect(removeSchedules).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(removeInvoiceLines).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(removePaymentRequests).toHaveBeenCalledWith(
      [1, 2],
      transaction
    )
    expect(transaction.commit).toHaveBeenCalledTimes(1)
    expect(transaction.rollback).not.toHaveBeenCalled()
  })

  test('rolls back transaction and throws error if any step fails', async () => {
    const error = new Error('Something went wrong')
    removeFRNAgreementClosed.mockRejectedValue(error)

    await expect(removeAgreementData(retentionData)).rejects.toThrow('Something went wrong')
    expect(transaction.rollback).toHaveBeenCalledTimes(1)
    expect(transaction.commit).not.toHaveBeenCalled()
  })
})
