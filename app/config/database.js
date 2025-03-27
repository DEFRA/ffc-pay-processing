const { DefaultAzureCredential, getBearerTokenProvider } = require('@azure/identity')

const isProd = () => {
  return process.env.NODE_ENV === 'production'
}

const hooks = {
  beforeConnect: async (cfg) => {
    if (isProd()) {
      const dbAuthEndpoint = 'https://ossrdbms-aad.database.windows.net/.default'
      const credential = new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
      const tokenProvider = getBearerTokenProvider(
        credential,
        dbAuthEndpoint
      )
      cfg.password = tokenProvider
    }
  }
}

const retry = {
  backoffBase: 500,
  backoffExponent: 1.1,
  match: [/SequelizeConnectionError/],
  max: 10,
  name: 'connection',
  timeout: 360000
}

const pool = {
  acquire: 360000,
  max: 10,
  min: 0
}

const config = {
  database: process.env.POSTGRES_DB || 'ffc_pay_processing',
  dialect: 'postgres',
  dialectOptions: {
    ssl: isProd(),
    statement_timeout: 360000
  },
  hooks,
  host: process.env.POSTGRES_HOST || 'ffc-pay-processing-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING === 'true',
  retry,
  pool,
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  username: process.env.POSTGRES_USERNAME
}

module.exports = config
