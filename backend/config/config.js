require('dotenv').config();
module.exports = {
    "development": {
        "host": process.env.DB_HOST,
        "server": process.env.DB_HOST,
        "database": process.env.DB_NAME,
        "username": process.env.DB_USER,
        "password": process.env.DB_PWD,

        // Use a different storage. Default: none
        "seederStorage": "json",
        // Use a different file name. Default: sequelize-data.json
        "seederStoragePath": "sequelizeData.json",
        // Use a different table name. Default: SequelizeData
        "seederStorageTableName": "sequelize_data",

        "dialect": "mssql",
        "dialectOptions": {
          "port": process.env.MSSQL_PORT,
          "connectTimeout": "60000", // Increase the connection timeout to 60 seconds
          "requestTimeout": "300000",
          "options": {
            "instanceName": process.env.MSSQL_INSTANCENAME,
            // "useUTC": false, //for reading from database
          },
          // "timezone": '+05:00', //for writing to database
        }
    },
    "production": {
        "host": process.env.DB_HOST,
        "server": process.env.DB_HOST,
        "database": process.env.DB_NAME,
        "username": process.env.DB_USER,
        "password": process.env.DB_PWD,

        // Use a different storage. Default: none
        "seederStorage": "json",
        // Use a different file name. Default: sequelize-data.json
        "seederStoragePath": "sequelizeData.json",
        // Use a different table name. Default: SequelizeData
        "seederStorageTableName": "sequelize_data",

        "dialect": "mssql",
        "dialectOptions": {
			"port": process.env.MSSQL_PORT,
      "connectTimeout": "60000", // Increase the connection timeout to 60 seconds
			"options": {
				"instanceName": process.env.MSSQL_INSTANCENAME,
			}
		}
    }
};