const MODULE_ID = 'api:servers'
const logger = require('../../utils/logger')
const errors = require('restify-errors')
const upsert = require('../../utils/upsert')

/*
{
    key: { type: Sequelize.STRING, allowNull: false, unique: true },
    status: Sequelize.JSON,
    name: Sequelize.STRING,
    host: Sequelize.STRING,
    command: Sequelize.STRING,
}
 */

module.exports = async (req, res, next) => {
    const {Servers} = req.models
    let resp = {}
    let {id} = req.query
    let values = {name, status, host, command} = req.query

    logger.info(`${MODULE_ID}: request received`, {id, name, status, host, command})
    resp = (id) ? await upsert(Servers, values, {id}) : new errors.BadRequestError('Invalid params.')
    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    next()
}
