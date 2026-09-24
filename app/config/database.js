const isProd = () => {
  return process.env.NODE_ENV === 'production'
}

const pool = {
  acquire: 360000,
  max: 10,
  min: 0
}

const config = {
  database: process.env.POSTGRES_DB || 'ffc_pay_processing',
  dialectOptions: {
    statement_timeout: 360000
  },
  host: process.env.POSTGRES_HOST || 'ffc-pay-processing-postgres',
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
  logging: process.env.POSTGRES_LOGGING === 'true',
  pool,
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  ssl: isProd(),
  username: process.env.POSTGRES_USERNAME
}

module.exports = config
