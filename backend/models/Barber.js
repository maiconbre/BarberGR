const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Barber = sequelize.define('Barber', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  whatsapp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pix: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = Barber;