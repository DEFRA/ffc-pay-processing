const retry = async (fn, retries = 5, interval = 500, exponential = false) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === retries) {
        throw err
      }

      const delay = exponential
        ? interval * (2 ** attempt)
        : interval

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

module.exports = { retry }
