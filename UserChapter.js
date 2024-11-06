const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});


function addUserChapter(idUser, idChapter) {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO user_chapter (id_user, id_chapter) VALUES (?, ?)`,
            [idUser, idChapter],
            (err, result) => {
                if (err) {
                    console.error('Error adding user chapter:', err);
                    return reject(err);
                }
                resolve({ message: 'User chapter added' });
            }
        );
    });
}

function addUserChapterWithScore(idUser, idChapter, score) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE user_chapter SET score = ? WHERE id_user = ? AND id_chapter = ?`,
            [score, idUser, idChapter],
            (err, result) => {
                if (err) {
                    console.error('Error scoring user chapter:', err);
                    return reject(err);
                }
                resolve({ message: 'User chapter scored' });
            }
        );
    });
}

module.exports = {
    addUserChapter,
    addUserChapterWithScore
}