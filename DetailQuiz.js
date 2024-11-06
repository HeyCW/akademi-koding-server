const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});


const answerQuiz = async (idQuiz, idUser, answer) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT jawaban, score FROM quiz WHERE id = ?`,
            [idQuiz],
            (err, result) => {
                if (err) {
                    console.error('Error adding answer:', err);
                    return reject(err);
                }
                
                if (answer === result[0].jawaban) {
                    connection.query(
                        `INSERT INTO detail_quizzes (id_user, id_quiz, jawaban, score) VALUES (?, ?, ?, ?)`,
                        [idUser, idQuiz, answer, result[0].score],
                        (err, result) => {
                            if (err) {
                                console.error('Error adding answer:', err);
                                return reject(err);
                            }
                            resolve({ message: 'Answer added' });
                        }
                    );
                    
                }
            }
        );
    });
}

const getUserQuizByChapter = (idUser, idChapter) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM detail_quizzes JOIN quiz ON detail_quizzes.id_quiz = quiz.id WHERE id_user = ? AND id_chapter = ?`,
            [idUser, idChapter],
            (err, result) => {
                if (err) {
                    console.error('Error getting user quiz:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

module.exports = {
    answerQuiz,
    getUserQuiz
}