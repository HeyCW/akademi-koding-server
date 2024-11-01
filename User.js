const connection = require('./Connection');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
require('dotenv').config();

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

function encryptPassword(password) {

    const encrypted = CryptoJS.AES.encrypt(password, process.env.CRYPTO_SECRET).toString();
    return encrypted;
}

function decryptPassword(password) {
    const decrypted = CryptoJS.AES.decrypt(password, process.env.CRYPTO_SECRET).toString(CryptoJS.enc.Utf8);
    return decrypted;
}   

function addUser(username, password) {
    return new Promise((resolve, reject) => {
        const token = jwt.sign({ username }, process.env.JWT_SECRET, {
            expiresIn: '2h'
        });

        const encryptedPassword = encryptPassword(password, process.env.CRYPTO_SECRET);

        connection.query(
            `INSERT INTO users (username, password, token) VALUES (?, ?, ?)`, 
            [username, encryptedPassword, token], // Gunakan parameter untuk menghindari SQL Injection
            (err, result) => {
                if (err) {
                    console.error('Error adding user:', err);
                    return reject(err); // Menolak promise jika ada error
                }
                
                resolve({ message: 'User added successfully' }); // Resolving promise dengan pesan
            }
        );
    });
}


function loginUser(username, password) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM users WHERE username = ?`,
            [username],
            (err, result) => {
                if (err) {
                    console.error('Error logging in:', err);
                    return reject(err);
                }
                
                if (result.length === 0) {
                    return resolve(null);
                }

                const user = result[0];

                const decryptedPassword = decryptPassword(user.password, process.env.CRYPTO_SECRET);

                if (password !== decryptedPassword) {
                    return resolve(null);
                }
                return resolve(user);
            }
        );
    });
}



module.exports = {addUser, loginUser};
