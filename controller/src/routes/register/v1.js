const MODULE_ID = 'api:register'
const logger = require('../../utils/logger')
const config = require('../../config')
const errors = require('restify-errors')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashPassword = async (password) => {
    let salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
}

module.exports = async (req, res, next) => {
    logger.info(`${MODULE_ID}: request received`)

    const {Users} = req.models
    let resp = {}
    let {email, password} = req.body
    if (email && password) {
        try {
            let hash = await hashPassword(password)
            let user = await Users.create({email, hash, roles: []})
            logger.info(`${MODULE_ID}: created user ${user}`)
            // Only include the information you need in the token, please read about JWT
            resp = {email}
            resp['token'] = jwt.sign(resp, config.JWT_SECRET)
            logger.info(`${MODULE_ID}: token generated`)
            res.send(resp)
            next()
        } catch (err) {
            logger.error(`${MODULE_ID}: error creating user ${email}, error ${err}`)
            res.send(new errors.BadRequestError('Username not available.'))
            return next()
        }
    } else {
        res.send(new errors.BadRequestError('Incomplete registration information.'))
        logger.info(`${MODULE_ID}: response sent`)
        next()
    }
}
