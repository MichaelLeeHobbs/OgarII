const MODULE_ID = 'api:models:settings.init'
const logger = require('../utils/logger')
const users = [{email: 'root', password: 'p@ssW0rd!', roles: ['admin']}]

const bcrypt = require('bcrypt');
const saltRounds = 10;
const hashPassword = async (password) => {
    let salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
}

module.exports = (models) => {
    users.forEach(async user=>{
        let {email, password, roles = []} = user
        let hash = await hashPassword(password)
        await models.Users.findCreateFind({where: {email}, defaults: {email, hash, roles}})
            .catch(error=>logger.error(`${MODULE_ID}: Failed to create user: ${email}`, error))
    })
}
