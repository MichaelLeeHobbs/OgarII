const MODULE_ID = 'app:main'
const config = require('./config')
const logger = require('./utils/logger')
const jwt = require('restify-jwt-community')
const restify = require('restify')
const plugins = require('restify').plugins
const models = require('./models')

logger.info(`${MODULE_ID}: initializing`)

let server = restify.createServer()
server.use(plugins.bodyParser())
server.use(plugins.queryParser())

// Auth
let jwtConfig = {
    secret: config.JWT_SECRET
}

// secure all routes. except /ping
server.use(jwt(jwtConfig).unless({
    path: [
        config.basePath('/ping'),
        config.basePath('/register'),
        config.basePath('/login'),
        config.basePath('/servers'),    // FIXME
        config.basePath('/settings'),   // FIXME
    ]
}))

server.use((req, res, next) => {
    req.models = models
    next()
})

// Routes
require('./routes')(server)

// Serve
server.listen(config.PORT)
logger.info(`${MODULE_ID}: ready. listening on PORT ${config.PORT}`)

module.exports = server