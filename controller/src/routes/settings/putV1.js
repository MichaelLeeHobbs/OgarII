const MODULE_ID = 'api:settings'
const logger = require('../../utils/logger')
const errors = require('restify-errors')
const upsert = require('../../utils/upsert')

module.exports = async (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    const {Settings} = req.models
    let resp = {}
    let {key, value} = req.query
    if (key && value) {
        resp = await upsert(Settings, {value}, {key})
    } else {
        resp = new errors.BadRequestError('Invalid params.')
    }
    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    next()
}
