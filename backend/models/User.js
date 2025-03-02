const { DataTypes } = require('sequelize');
const sequelize = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'client'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to check password
User.prototype.comparePassword = async function(candidatePassword) {
  console.log('Comparando senhas:');
  console.log('- Senha fornecida:', candidatePassword);
  console.log('- Senha armazenada (hash):', this.password.substring(0, 10) + '...');
  
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Resultado da comparação:', isMatch ? 'Corresponde' : 'Não corresponde');
    return isMatch;
  } catch (error) {
    console.error('Erro ao comparar senhas:', error);
    return false;
  }
};

module.exports = User;
