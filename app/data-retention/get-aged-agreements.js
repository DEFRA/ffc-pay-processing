const { CS, BPS } = require('../constants/schemes')
const db = require('../data')

const getAgedAgreements = async () => {
  return db.frnAgreementClosed.findAll({
    where: {
      closureDate: {
        [db.Sequelize.Op.lt]: db.Sequelize.literal(`CASE 
          WHEN "schemeId" IN (${CS}, ${BPS}) THEN NOW() - INTERVAL '11 YEARS'
          ELSE NOW() - INTERVAL '7 YEARS'
        END`)
      }
    }
  })
}

module.exports = {
  getAgedAgreements
}
