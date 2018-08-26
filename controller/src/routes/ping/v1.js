const MODULE_ID = 'api:hello'
const logger    = require('../../utils/logger')

module.exports = (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    res.send({ ping: 'OK' })

    logger.info(`${MODULE_ID}: response sent`)
    return next()
}