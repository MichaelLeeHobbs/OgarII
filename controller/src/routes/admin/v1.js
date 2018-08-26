const MODULE_ID = 'api:admin'
const logger    = require('../../utils/logger')

const httpErr   = require('restify-errors')

module.exports = (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    // check if authentication has admin access
    // override this check if user's role is test
    // be careful though not to allow permanent changes is user's role is test
    // or maybe make sure you don't grant test role to an end user
    if (!req.user.role === 'admin' && req.user.role !== 'test') {
        return res.send(new httpErr.ForbiddenError('You don\'t have sufficient priviledges.'))
    }

    res.send({ action: 'completed' })

    logger.info(`${MODULE_ID}: response sent`)
    return next()
}