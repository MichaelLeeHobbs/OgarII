const MODULE_ID = 'api:whoami'
const logger    = require('../../utils/logger')

module.exports = (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    res.send(req.user)

    logger.info(`${MODULE_ID}: response sent`)
    return next()
}