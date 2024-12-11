const connection = require('./Connection');

// connection.connect((err) => {
//     if (err) {
//         console.error('Error connecting to RDS:', err);
//         return;
//     }
//     console.log('Connected to Local');
// });

// Add a new enrollment
function enrollUser(userId, moduleId) {
    return new Promise((resolve, reject) => {
        const query = `INSERT INTO user_enrollments (user_id, module_id, completed) VALUES (?, ?, FALSE)`;
        connection.query(query, [userId, moduleId], (err, result) => {
            if (err) {
                console.error('Error enrolling user:', err);
                return reject(err);
            }
            resolve({ id: result.insertId, userId, moduleId });
        });
    });
}

// Check if a user has an active enrollment
function checkActiveEnrollment(userId) {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM user_enrollments WHERE user_id = ? AND completed = FALSE`;
        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error checking active enrollment:', err);
                return reject(err);
            }
            resolve(results);
        });
    });
}

// Mark an enrollment as completed (if needed in the future)
function completeEnrollment(userId, moduleId) {
    return new Promise((resolve, reject) => {
        const query = `UPDATE user_enrollments SET completed = 1 WHERE user_id = ? AND module_id = ?`;
        connection.promise().query(query, [userId, moduleId]) // Add moduleId in query
            .then(([result]) => {
                resolve({ message: 'Enrollment marked as completed.', result });
            })
            .catch((err) => {
                console.error('Error completing enrollment:', err);
                reject(err);
            });
    });
}

module.exports = { enrollUser, checkActiveEnrollment, completeEnrollment };