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
                    logger.info(`${MODULE_ID}: Invalid password for: ${email} ${password}`)
                    resp = new errors.InvalidCredentialsError()
                }
            } else {
                logger.info(`${MODULE_ID}: User not found: ${email}`)
                resp = new errors.InvalidCredentialsError()
            }
        } catch (error) {
            logger.error(`${MODULE_ID}: Error ${error}`, error)
            resp = error
        }
    } else {
        logger.info(`${MODULE_ID}: Invalid creds: ${email} ${password}`)
        resp = new errors.InvalidCredentialsError()
    }

    res.send(resp)
    logger.info(`${MODULE_ID}: response sent`)
    return next()
}