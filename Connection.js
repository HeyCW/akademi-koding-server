const mysql = require('mysql2');
const createDatabase = 'CREATE DATABASE IF NOT EXISTS `akademi-koding`';

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'akademi-koding',
});

module.exports = connection;
