const mysql = require('mysql2');
const createDatabase = 'CREATE DATABASE IF NOT EXISTS `akademi-koding`';

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',       
    password: '',  
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

function initState() {
    connection.query(createDatabase, (err, result) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database created');
    });

    connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'akademi-koding'
    });

}

function createTable() {
    const createTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        username VARCHAR(100) NOT NULL,
        password VARCHAR(255) NOT NULL
    );
    `;
    connection.query(createTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Table created');
    });
}

module.exports = { initState, createTable, connection };





