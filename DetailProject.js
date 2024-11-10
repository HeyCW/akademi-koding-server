const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

const submitProject = async (idUser, idModule, project) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO detail_projects (id_user, id_module, project) VALUES (?, ?, ?)`,
            [idUser, idModule, project],
            (err, result) => {
                if (err) {
                    console.error('Error adding project:', err);
                    return reject(err);
                }
                resolve({ message: 'Project submitted' });
            }
        );
    });
}

const scoreProject = async (idUser, idModule, score) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE detail_projects SET score = ? WHERE id_user = ? AND id_module = ?`,
            [score, idUser, idModule],
            (err, result) => {
                if (err) {
                    console.error('Error scoring project:', err);
                    return reject(err);
                }
                resolve({ message: 'Project scored' });
            }
        );
    });
}

module.exports = {
    submitProject,
    scoreProject
}