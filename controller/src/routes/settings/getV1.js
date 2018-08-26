const MODULE_ID = 'api:settings'
const logger = require('../../utils/logger')
const config = require('../../config')
const errors = require('restify-errors')
const jwt = require('jsonwebtoken')


module.exports = async (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    const {Settings} = req.models
    let resp = {}
    let {key} = req.query
    if (key) {
        let value = await Settings.findOne({where: {key}})
        if (value) {
            resp = {[key]: value}
        } else {
            resp = new errors.NotFoundError()
        }
    } else {
        let settings = await Settings.findAll()
        resp = settings
    }
    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    next()
}
