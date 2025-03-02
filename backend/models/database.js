const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgresql://barbershop_lrs5_user:6VIUsrvKvRe4Z6hAB6j9QXpPRhoAIxKD@dpg-cuudkean91rc73ct53g0-a.oregon-postgres.render.com/barbershop_lrs5', {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

// Testar a conexão
sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(err => {
    console.error('Não foi possível conectar ao banco de dados:', err);
  });

module.exports = sequelize;