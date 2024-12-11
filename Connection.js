const mysql = require('mysql2');

const connection = mysql.createPool({
    host: process.env.DB_ENDPOINT || 'localhost',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'akademi-koding',
    connectionLimit: 50,
});

module.exports = connection;
    