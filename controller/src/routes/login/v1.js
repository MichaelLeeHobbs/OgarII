const MODULE_ID = 'api:login'
const logger = require('../../utils/logger')
const config = require('../../config')
const errors = require('restify-errors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

module.exports = async (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    const {Users} = req.models
    let resp = {}
    let {email, password} = req.body

    if (email && password) {
        try {
            let user = await Users.findOne({where: {email}})
            if (user) {
                let validPassword = await bcrypt.compare(password, user.hash)
                if (validPassword) {
                    let {roles} = user
                    // Only include the information you need in the token, please read about JWT
                    resp = {email, roles}
                    resp['token'] = jwt.sign(resp, config.JWT_SECRET)
                    logger.info(`${MODULE_ID}: token generated`)
                } else {
                    resp = new errors.BadRequestError('Invalid username or password.')
                }
            } else {
                resp = new errors.BadRequestError('Invalid username or password.')
            }
        } catch (error) {
            // todo handle error?
            resp = error
        }
    } else {
        resp = new errors.BadRequestError('Invalid username or password.')
    }

    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    return next()
}