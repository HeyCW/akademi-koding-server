const mysql = require('mysql2');

let connection = mysql.createConnection({
    host: process.env.DB_ENDPOINT || 'localhost',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: 'akademi-koding',
});

module.exports = connection;
