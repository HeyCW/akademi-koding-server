require('dotenv').config();
const mysql = require('mysql2');
const createDatabase = 'CREATE DATABASE IF NOT EXISTS `akademi-koding`';

console.log(process.env.DB_ENDPOINT );
console.log(process.env.DB_USERNAME );
console.log(process.env.DB_PASSWORD );

let connection = mysql.createConnection({
    host: process.env.DB_ENDPOINT || 'localhost',
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

connection.query(createDatabase, (err, result) => {
    if (err) {
        console.error('Error creating database:', err);
        return;
    }

    console.log('Database created successfully');
});