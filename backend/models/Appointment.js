const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  serviceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  barberId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  barberName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

module.exports = Appointment;  // Exportação correta