const config = require('../config.json');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        let sequelize;
        
        // Check if running in production environment (Render)
        if (process.env.NODE_ENV === 'production') {
            console.log('Initializing database in production mode');
            
            // Use environment variables for database connection in production
            const dbUrl = process.env.DATABASE_URL;
            
            if (dbUrl) {
                // If using connection URL
                console.log('Using DATABASE_URL for connection');
                sequelize = new Sequelize(dbUrl, {
                    dialect: 'mysql',
                    dialectOptions: {
                        ssl: {
                            rejectUnauthorized: false
                        }
                    },
                    logging: console.log
                });
            } else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_NAME) {
                // If using separate environment variables
                console.log('Using environment variables for database connection');
                sequelize = new Sequelize(
                    process.env.DB_NAME,
                    process.env.DB_USER,
                    process.env.DB_PASSWORD, 
                    {
                        host: process.env.DB_HOST,
                        port: process.env.DB_PORT || 3306,
                        dialect: 'mysql',
                        dialectOptions: {
                            ssl: {
                                rejectUnauthorized: false
                            }
                        },
                        logging: console.log
                    }
                );
            } else if (config.production_database) {
                // Fallback to config.json production_database settings
                console.log('Using production_database settings from config.json');
                const { host, port, user, password, database, ssl } = config.production_database;
                
                const dialectOptions = ssl ? {
                    ssl: {
                        rejectUnauthorized: false
                    }
                } : {};
                
                sequelize = new Sequelize(database, user, password, {
                    host: host,
                    port: port || 3306,
                    dialect: 'mysql',
                    dialectOptions,
                    logging: console.log
                });
            } else {
                throw new Error('No database configuration found for production environment');
            }
        } else {
            // Development mode - use config.json
            console.log('Initializing database in development mode');
            
            // create db if it doesn't already exist
            const { host, port, user, password, database } = config.database;

            // Step 1: Connect without database and create it if needed
            const connection = await mysql.createConnection({ host, port, user, password });
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
            await connection.end();

            // Step 2: Now connect with Sequelize as usual
            sequelize = new Sequelize(database, user, password, { 
                host: host,
                port: port,
                dialect: 'mysql',
                logging: console.log // Enable logging
            });
        }

        // Make sequelize available
        db.sequelize = sequelize;

        await sequelize.authenticate();
        console.log("Database connection established!");

        // init models and add them to the exported db object
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);
        db.Workflow = require('../workflows/workflow.model')(sequelize);
        
        // Set up associations
        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        db.Employee.belongsTo(db.Account, { foreignKey: 'userId', as: 'user' });
        db.Employee.belongsTo(db.Department, { foreignKey: 'departmentId' });
        db.Department.hasMany(db.Employee, { foreignKey: 'departmentId' });

        db.Request.belongsTo(db.Employee, { foreignKey: 'employeeId' });
        db.Request.hasMany(db.RequestItem, { foreignKey: 'requestId' });
        db.RequestItem.belongsTo(db.Request, { foreignKey: 'requestId' });

        db.Workflow.belongsTo(db.Employee, { foreignKey: 'employeeId', as: 'employee' });
        db.Employee.hasMany(db.Workflow, { foreignKey: 'employeeId', as: 'workflows' });

        // sync all models with database
        await sequelize.sync({ alter: true }); // Only alter tables, do not drop
        console.log("Database tables created or updated successfully!");
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
}