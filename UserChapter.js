const connection = require('./Connection');

// connection.connect(err => {
//     if (err) {
//         console.error('Error connecting to RDS:', err);
//         return;
//     }
//     console.log('Connected to Local');
// });

function fetchChapters(userId, moduleId) {
    return new Promise((resolve, reject) => {
        const query = `
        SELECT 
            c.id AS chapterId, 
            c.module_id, 
            c.name, 
            c.type, 
            c.content, 
            uc.status AS completed 
        FROM chapters c
        LEFT JOIN user_chapters uc 
            ON c.id = uc.chapter_id AND uc.user_id = ?
        WHERE c.module_id = ?
    `;

        connection.query(query, [userId, moduleId], (err, results) => {
            if (err) {
                console.error("Error fetching chapters:", err);
                return reject(err);
            }

            // Map results to include a normalized `completed` flag
            const chapters = results.map((chapter) => ({
                id: chapter.chapterId,
                moduleId: chapter.module_id,
                name: chapter.name,
                type: chapter.type,
                content: chapter.content,
                completed: chapter.completed === 1, // Normalize `completed` to boolean
            }));

            resolve(chapters);
        });
    });
}


function addUserChapter(userId, chapterId, status) {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO user_chapters (user_id, chapter_id, status, score) VALUES (?, ?, ?, NULL)`,
            [userId, chapterId, status],
            (err, result) => {
                if (err) {
                    console.error("Error adding user chapter:", err);
                    reject(err);
                } else {
                    resolve({ message: "User chapter added successfully" });
                }
            }
        );
    });
}

function addUserChapterWithScore(idUser, idChapter, score) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE user_chapters SET score = ? WHERE id_user = ? AND id_chapter = ?`,
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
    fetchChapters,
    addUserChapter,
    addUserChapterWithScore
}