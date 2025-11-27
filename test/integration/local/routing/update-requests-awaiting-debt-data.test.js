const { resetDatabase, closeDatabaseConnection, savePaymentRequest } = require('../../../helpers')

jest.mock('../../../../app/routing/prepare-for-reprocessing')
const { prepareForReprocessing: mockPrepareForReprocessing } = require('../../../../app/routing/prepare-for-reprocessing')

const { RECOVERY_DATE } = require('../../../mocks/values/recovery-date')

const { ADMINISTRATIVE } = require('../../../../app/constants/debt-types')

const { updateRequestsAwaitingDebtData } = require('../../../../app/routing/update-requests-awaiting-debt-data')

let paymentRequest

describe('update requests awaiting debt data', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await resetDatabase()

    paymentRequest = structuredClone(require('../../../mocks/payment-requests/payment-request'))
  })

  test('should prepare payment request for reprocessing if payment request has debt type and can be matched by invoice number', async () => {
    await savePaymentRequest(paymentRequest)
    paymentRequest.debtType = ADMINISTRATIVE
    paymentRequest.recoveryDate = RECOVERY_DATE
    await updateRequestsAwaitingDebtData(paymentRequest)
    expect(mockPrepareForReprocessing).toHaveBeenCalledWith(expect.any(Object, { invoiceNumber: paymentRequest.invoiceNumber }), ADMINISTRATIVE, RECOVERY_DATE)
  })

  test('should throw error if received payment request does not have debt data', async () => {
    await savePaymentRequest(paymentRequest)
    await expect(async () => updateRequestsAwaitingDebtData(paymentRequest)).rejects.toThrow()
  })

  test('should throw error if no matching payment request found', async () => {
    paymentRequest.debtType = ADMINISTRATIVE
    paymentRequest.recoveryDate = RECOVERY_DATE
    await expect(async () => updateRequestsAwaitingDebtData(paymentRequest)).rejects.toThrow()
  })

  afterAll(async () => {
    await closeDatabaseConnection()
  })
})
