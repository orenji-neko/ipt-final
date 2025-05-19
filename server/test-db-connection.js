require('rootpath')();
const config = require('./config.json');
const { Sequelize } = require('sequelize');

async function testConnection() {
  try {
    console.log('Testing database connection with the production credentials...');
    
    const { host, port, user, password, database, ssl } = config.production_database;
    
    const dialectOptions = ssl ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {};
    
    const sequelize = new Sequelize(database, user, password, {
      host: host,
      port: port || 3306,
      dialect: 'mysql',
      dialectOptions,
      logging: console.log
    });
    
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Close the connection
    await sequelize.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection(); 