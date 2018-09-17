const Sequelize = require('sequelize')
module.exports = {
    name: { type: Sequelize.STRING, allowNull: false, unique: true },
    status: Sequelize.STRING,
    host: Sequelize.STRING,
    command: Sequelize.STRING,
}