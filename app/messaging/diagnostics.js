const insights = require('../insights')

const createDiagnosticsHandler = (name) => (args) => {
  const error = args?.error

  console.error(`[${name}] Service Bus receiver error`, {
    code: error?.code,
    message: error?.message,
    stack: error?.stack
  })

  insights.trackException(error)
}

module.exports = { createDiagnosticsHandler }
