const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

const getProjectDetails = async (idModule) => {
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM detail_projects WHERE module_id = ?`;

        connection.query(query, [idModule], (err, results) => {
            if (err) {
                console.error('Error fetching project details:', err);
                return reject(err);
            }

            if (results.length === 0) {
                return resolve({ message: 'No project found for the given user and module.' });
            }

            resolve(results);
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

const submitProject = async (idUser, idModule, link) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO detail_projects (user_id, module_id, link) VALUES (?, ?, ?)`,
            [idUser, idModule, link],
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

const getProjectByUser = async (idUser, idModule) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM detail_projects WHERE user_id = ? AND module_id = ?`,
            [idUser, idModule],
            (err, results) => {
                if (err) {
                    console.error('Error checking project:', err);
                    return reject(err);
                }
                resolve(results);
            }
        );
    });
};

module.exports = {
    getProjectDetails,
    updateProject,
    submitProject,
    getProjectByUser,
};