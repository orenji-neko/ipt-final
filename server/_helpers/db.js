const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    // create db if it doesn't already exist
    const { host, port, user, password, database } = config.database;

    const sequelize = new Sequelize(database, user, password, { 
        host: host,
        port: port,
        dialect: 'mysql' 
    });

    try {
        await sequelize.authenticate();
        console.log("Database connection established!");
    } catch(err) {
        console.error('Unable to connect to the database:', error);
    }

    // init models and add them to the exported db object
    db.Account = require('../accounts/account.model')(sequelize);
    db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

    // define relationships
    db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
    db.RefreshToken.belongsTo(db.Account);

    // sync all models with database
    await sequelize.sync({ alter: true, logging: false });
}