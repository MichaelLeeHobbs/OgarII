const Sequelize = require('sequelize')
const sequelize = new Sequelize('ogar3', 'postgres', 'example', {
    host: '192.168.1.200',
    dialect: 'postgres',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
    operatorsAliases: false
})

const models = {
    Users: sequelize.define('users', require('./user')),
    Settings: sequelize.define('settings', require('./setting')),
}
sequelize.sync().then(()=>{
    // initialize tables
    require('./settings.init')(models)
})



module.exports = models

