const Sequelize = require('sequelize')
module.exports = {
    key: { type: Sequelize.STRING, allowNull: false, unique: true },
    value: Sequelize.JSON,
}