const appInsights = require('applicationinsights')

let client = null

const setup = () => {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights.setup(process.env.APPINSIGHTS_CONNECTIONSTRING).start()
    console.log('App Insights Running')

    client = appInsights.defaultClient

    const cloudRoleTag = client.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    if (appName) {
      client.context.tags[cloudRoleTag] = appName
    }
  } else {
    console.log('App Insights Not Running!')
  }
}

const trackException = (error) => {
  if (client && error) {
    client.trackException({ exception: error })
  }
}

const trackTrace = (message) => {
  if (client && message) {
    client.trackTrace({ message })
  }
}

module.exports = {
  setup,
  trackException,
  trackTrace
}
