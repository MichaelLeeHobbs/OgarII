const restify = require('restify')
const config    = require('../../config')
const PATH = config.basePath('/servers')

module.exports = (server) => {
    server.get(PATH, restify.plugins.conditionalHandler([
        {version: '1.0.0', handler: require('./getV1')}
    ]))
    server.put(PATH, restify.plugins.conditionalHandler([
        {version: '1.0.0', handler: require('./putV1')}
    ]))
}