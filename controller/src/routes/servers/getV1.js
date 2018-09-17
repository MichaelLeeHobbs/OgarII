const MODULE_ID = 'api:servers'
const logger = require('../../utils/logger')
const errors = require('restify-errors')

module.exports = async (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    const {Servers} = req.models
    let resp = {}
    let {id} = req.query
    if (id) {
        let server = await Servers.findOne({where: {id}})
        resp = (server) ? server : new errors.NotFoundError()
    } else {
        resp = await Servers.findAll()
    }
    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    next()
}
