const MODULE_ID = 'api:home:v1'
const logger    = require('../../utils/logger')

module.exports = (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    // get the user's name from the JWT
    res.send({ hello: req.user.name })

    logger.info(`${MODULE_ID}: response sent`)
    return next()
}