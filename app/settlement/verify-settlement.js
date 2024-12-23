const invoicePatterns = {
  FDMR: /F\d{7}C\d{7}V\d{3}/g,
};

const verifySettlement = (settlement) => {
  for (const [key, pattern] of Object.entries(invoicePatterns)) {
    const matches = settlement.match(pattern);
    if (matches) {
      console.log(`Blocked invoice pattern "${key}" detected:`, matches);
      return false; 
    }
  }
  return true;
};

module.exports = {
  verifySettlement,
};
