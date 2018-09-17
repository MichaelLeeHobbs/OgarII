const MODULE_ID = 'db'
const Sequelize = require('sequelize')
const logger = require('../utils/logger')
const { Client } = require('pg')

const pgConfig = {
    host: 'db',
    port: '5432',                                           // default process.env.PGPORT
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'example',
    database: 'postgres',
}

const sequelizeConfig = {
    database: process.env.POSTGRES_DB || 'ogar3',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'example',
    host: 'db',
    dialect: 'postgres',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
}

let models = {}

async function init() {
    const client = new Client(pgConfig)
    try {
        await client.connect()
    } catch(error) {
        logger.error(`${MODULE_ID}: PG connection error: ${error}`, error)
        return setTimeout(()=>init(), 10000)
    }

    logger.info(`${MODULE_ID}: Initializing DB.`)
    // create the db and ignore any errors, for example if it already exists.
    await client.query(`CREATE DATABASE ${sequelizeConfig.database};`).catch(error=>{
        if (error.message.indexOf('already exists') !== -1) {
            logger.error(`${MODULE_ID}: PG Create DB error: ${error.message}`, error)
        }
    })
        //db should exist now, initialize Sequelize
    const sequelize = new Sequelize(sequelizeConfig)
    models.Users = sequelize.define('users', require('./user'))
    models.Settings = sequelize.define('settings', require('./setting'))
    models.Servers = sequelize.define('servers', require('./server'))

    sequelize.sync().then(() => {
        // initialize tables
        require('./settings.init')(models)
        require('./users.init')(models)
        require('./servers.init')(models)
    }).then(()=>client.end())   // close the connection
}

init()

module.exports = models
