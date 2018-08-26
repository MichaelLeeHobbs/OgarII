const restify = require('restify')
const config    = require('../../config')
const PATH = config.basePath('/login')

module.exports = (server) => {
    server.post(PATH, restify.plugins.conditionalHandler([
        {version: '1.0.0', handler: require('./v1')}
    ]))
}