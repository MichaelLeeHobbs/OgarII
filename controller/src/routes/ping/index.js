const restify = require('restify')
const config = require('../../config')
const PATH = config.basePath('/ping')

module.exports = (server) => {
    server.get(PATH, restify.plugins.conditionalHandler([
        {version: '1.0.0', handler: require('./v1')}
    ]))
}