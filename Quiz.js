const connection = require('./Connection');

// connection.connect(err => {
//     if (err) {
//         console.error('Error connecting to RDS:', err);
//         return;
//     }
//     console.log('Connected to Local');
// });

const getAllQuizByChapter = (idChapter) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM quiz WHERE id_chapter = ?`,
            [idChapter],
            (err, result) => {
                if (err) {
                    console.error('Error getting quiz:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

const getQuizById = (id) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM quiz WHERE id = ?`,
            [id],
            (err, result) => {
                if (err) {
                    console.error('Error getting quiz:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

const addQuiz = (idChapter, question, jawaban, score) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO quiz (id_chapter, question, jawaban, score) VALUES (?, ?, ?, ?)`,
            [idChapter, question, jawaban, score],
            (err, result) => {
                if (err) {
                    console.error('Error adding quiz:', err);
                    return reject(err);
                }
                resolve({ message: 'Quiz added' });
            }
        );
    });
}

const updateQuiz = (id, question, jawaban, score) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE quiz SET question = ?, jawaban = ?, score = ? WHERE id = ?`,
            [question, jawaban, score, id],
            (err, result) => {
                if (err) {
                    console.error('Error updating quiz:', err);
                    return reject(err);
                }
                resolve({ message: 'Quiz updated' });
            }
        );
    });
}

const removeQuiz = (id) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `DELETE FROM quiz WHERE id = ?`,
            [id],
            (err, result) => {
                if (err) {
                    console.error('Error deleting quiz:', err);
                    return reject(err);
                }
                resolve({ message: 'Quiz deleted' });
            }
        );
    });
}

module.exports = {
    getAllQuizByChapter,
    getQuizById,
    addQuiz,
    updateQuiz,
    removeQuiz
};