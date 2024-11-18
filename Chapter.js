const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

function addChapter(module_id, name, type, content) {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO chapters (module_id, name,  type, content) VALUES (?, ?, ?, ?)`,
            [module_id, name, type, content],
            (err, result) => {
                if (err) {
                    console.error('Error adding chapter:', err);
                    return reject(err);
                }
                resolve({ message: 'Chapter added' });
            }
        );
    });
}

function updateChapter(id, name, type, content) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE chapters SET name = ?, type = ?, content = ? WHERE id=?`,
            [name, type, content, id],
            (err, result) => {
                if (err) {
                    console.error('Error updating chapter:', err);
                    return reject(err);
                }
                resolve({ message: 'Chapter updated' });
            }
        );
    });
}

function getAllChapters() {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM chapters`,
            (err, result) => {
                if (err) {
                    console.error('Error getting chapters:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function getChapterById(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM chapters WHERE id = ?`,
            [id],
            (err, result) => {
                if (err) {
                    console.error('Error getting chapter:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function getChapterByModuleId(module_id) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM chapters WHERE module_id = ?`,
            [module_id],
            (err, result) => {
                if (err) {
                    console.error('Error getting chapter:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function removeChapterById(id) {
    return new Promise((resolve, reject) => {
        connection.query(
            `DELETE FROM chapters WHERE id=?`,
            [id],
            (err, result) => {
                if (err) {
                    console.error('Error deleting chapter:', err);
                    return reject(err);
                }
                resolve({ message: 'Chapter deleted' });
            }
        );
    });
}

module.exports = { addChapter, updateChapter, getAllChapters, getChapterById, removeChapterById, getChapterByModuleId };


