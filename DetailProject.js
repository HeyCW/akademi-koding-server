const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

const getProjectDetails = async (idUser, idModule) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM detail_projects WHERE id_user = ? AND id_module = ?`;

        connection.query(query, [idUser, idModule], (err, results) => {
            if (err) {
                console.error('Error fetching project details:', err);
                return reject(err);
            }

            if (results.length === 0) {
                return resolve({ message: 'No project found for the given user and module.' });
            }

            resolve(results[0]);
        });
    });
};

const updateProject = async (id, comment, score) => {
    return new Promise((resolve, reject) => {
        const query = `UPDATE detail_projects SET comment = ?, score = ? WHERE id = ?`;

        connection.query(query, [comment, score, id], (err, result) => {
            if (err) {
                console.error('Error updating project:', err);
                return reject(err);
            }

            if (result.affectedRows === 0) {
                return resolve({ message: 'No project found to update.' });
            }

            resolve({ message: 'Project updated successfully.' });
        });
    });
};

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

module.exports = {
    getProjectDetails,
    updateProject,
    submitProject,
};