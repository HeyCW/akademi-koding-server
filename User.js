const connection = require('./Connection');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');


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

        const encryptedPassword = encryptPassword(password);

        connection.query(
            `INSERT INTO users (username, password, token) VALUES (?, ?, ?)`,
            [username, encryptedPassword, token],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return reject({ error: 'Username already exists' });
                    }
                    return reject(err);
                }
                resolve({ message: 'User added successfully' });
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
                    console.error('Error querying the database:', err);
                    return reject(err); // Reject on error
                }

                if (result.length === 0) {
                    return resolve(null); // Resolve with null if user not found
                }

                const user = result[0];
                const decryptedPassword = decryptPassword(user.password);

                if (password !== decryptedPassword) {
                    return resolve(null); // Resolve with null if password mismatch
                }

                const token = jwt.sign({ username }, process.env.JWT_SECRET, {
                    expiresIn: '2h'
                });

                // Resolve with the user data and token
                return resolve({
                    id: user.id,
                    username: user.username,
                    token,
                });
            }
        );
    });
}



module.exports = { addUser, loginUser };
