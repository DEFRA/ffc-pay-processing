const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

jest.mock('../../../../app/auto-hold')
const { removeAutoHold: mockRemoveAutoHold } = require('../../../../app/auto-hold')

const paymentRequest = require('../../../mocks/payment-requests/payment-request')
const { RECOVERY_DATE } = require('../../../mocks/values/recovery-date')

const { ADMINISTRATIVE, IRREGULAR } = require('../../../../app/constants/debt-types')
const { AWAITING_DEBT_ENRICHMENT } = require('../../../../app/constants/hold-categories-names')

const db = require('../../../../app/data')

const { prepareForReprocessing } = require('../../../../app/routing/prepare-for-reprocessing')

describe('prepare for reprocessing', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()
    const { id } = await savePaymentRequest(paymentRequest)
    paymentRequest.paymentRequestId = id
  })

  test.each([
    [ADMINISTRATIVE],
    [IRREGULAR]
  ])('updates payment request with new debt type: %s', async (debtType) => {
    await prepareForReprocessing(paymentRequest, debtType, RECOVERY_DATE)
    const updatedPaymentRequest = await db.paymentRequest.findOne({ where: { paymentRequestId: paymentRequest.paymentRequestId } })
    expect(updatedPaymentRequest.debtType).toEqual(debtType)
  })

  test('should update payment request with new recovery date', async () => {
    await prepareForReprocessing(paymentRequest, ADMINISTRATIVE, RECOVERY_DATE)
    const updatedPaymentRequest = await db.paymentRequest.findOne({ where: { paymentRequestId: paymentRequest.paymentRequestId } })
    expect(updatedPaymentRequest.recoveryDate).toEqual(RECOVERY_DATE)
  })

  test('should remove debt enrichment hold', async () => {
    await prepareForReprocessing(paymentRequest, ADMINISTRATIVE, RECOVERY_DATE)
    expect(mockRemoveAutoHold).toHaveBeenCalledWith(paymentRequest, AWAITING_DEBT_ENRICHMENT)
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
