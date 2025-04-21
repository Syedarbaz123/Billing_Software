'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};
const moment = require('moment');

// MSSQL Inserting or Updating a Date field give the following error Conversion failed 
// when converting date and/or time from character string
///////////// SOLUTION:///////////////
// Override timezone formatting
Sequelize.DATE.prototype._stringify = function _stringify(date, options) {
    // Z here means current timezone, _not_ UTC
    // return date.format('YYYY-MM-DD HH:mm:ss.SSS Z');
    return moment(date).format('YYYY-MM-DD HH:mm:ss.SSS');
};
 
let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, {
        "host": "DESKTOP-NARC1GB",
        "port": 1433,
        "dialect": "mssql",
        "dialectOptions": {
            options: { 
                // "requestTimeout": 300000
                encrypt: false,  // SSL disable karein
                trustServerCertificate: true, // Self-signed certificate ke liye
            }
        },
    });
}

const testingConnnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testingConnnection();

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes, Sequelize.Model);
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// db.sequelize = sequelize;
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
