const MODULE_ID = 'api:models:settings.init'
const logger = require('../utils/logger')
const Settings = require('../../../datafiles/Settings')

module.exports = (models) => {
    Object.keys(Settings).forEach(async key => {
        await models.Settings.findCreateFind({where: {key}}, {key, value: Settings[key]})
            .catch(error=>logger.error(`${MODULE_ID}: bad key/value -  key: ${key}, value: ${Settings[key]}`, error))
    })
}
