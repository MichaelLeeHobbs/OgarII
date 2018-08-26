const MODULE_ID = 'api:home:v2'
const logger    = require('../../utils/logger')

module.exports = (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    res.send({ welcome: req.user.name })

    logger.info(`${MODULE_ID}: response sent`)
    return next()
}