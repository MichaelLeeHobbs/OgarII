const Sequelize = require('sequelize')
module.exports = {
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    hash: Sequelize.TEXT,
    roles: Sequelize.JSON,
}