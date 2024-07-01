const routes = [].concat(
  require('../routes/healthy'),
  require('../routes/healthz'),
  require('../routes/schemes'),
  require('../routes/holds'),
  require('../routes/payment-requests'),
  require('../routes/closures'),
  require('../routes/tracking-migration')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server) => {
      server.route(routes)
    }
  }
}
