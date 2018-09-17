const MODULE_ID = 'api:models:server.init'
const logger = require('../utils/logger')

module.exports = (models) => {
    let defaultServer = {
        name: "Isaac's Ogar Server",
        status: "",
        host: "localhost",
        command: "",
    }
    return models.Servers.findCreateFind({where: {name: defaultServer.name}, defaults: defaultServer})
        .catch(error => logger.error(`${MODULE_ID}: failed to create default server`, error))
}
