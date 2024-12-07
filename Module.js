const connection = require('./Connection');
connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

function addModule(course_id, name, link, slug, description, project) {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO modules (course_id, name, link, slug, description, project) VALUES (?, ?, ?, ?, ?, ?)`,
            [course_id, name, link, slug, description, project],
            (err, result) => {
                if (err) {
                    console.error('Error adding module:', err);
                    return reject(err);
                }
                resolve({ 'id': result.insertId, 'name': name, 'link': link, 'slug': slug, 'description': description, 'project': project });
            }
        );
    });
}

function updateModule(id, name, link, slug, description, project) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE modules SET name = ?, description = ?, slug = ?, link = ?, project = ? WHERE id=?`,
            [name, description, slug, link, project, id],
            (err, result) => {
                if (err) {
                    console.error('Error updating module:', err);
                    return reject(err);
                }
                resolve({ message: 'Module updated' });
            }
        );
    });
}

function getAllModules() {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM modules`,
            (err, result) => {
                if (err) {
                    console.error('Error getting modules:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}


function getModuleBySlug(slug) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM modules WHERE slug = ?`,
            [slug],
            (err, result) => {
                if (err) {
                    console.error('Error getting module:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function getModuleById(idModule) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM modules WHERE id = ?`,
            [idModule],
            (err, result) => {
                if (err) {
                    console.error('Error getting module:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function getModuleByCourseId(course_id) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM modules WHERE course_id = ?`,
            [course_id],
            (err, result) => {
                if (err) {
                    console.error('Error getting module:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}   

function removeModule(slug) {
    return new Promise((resolve, reject) => {
        connection.query(
            `DELETE FROM modules WHERE slug = ?`,
            [slug],
            (err, result) => {
                if (err) {
                    console.error('Error deleting module:', err);
                    return reject(err);
                }
                resolve({ message: 'Module deleted' });
            }
        );
    });
}

function removeModuleById(idModule) {
    return new Promise((resolve, reject) => {
        connection.query(
            `DELETE FROM modules WHERE id = ?`,
            [idModule],
            (err, result) => {
                if (err) {
                    console.error('Error deleting module:', err);
                    return reject(err);
                }
                resolve({ message: 'Module deleted' });
            }
        );
    });
}

function getProjectByModuleId(slugModule) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT project FROM modules WHERE slug = ?`,
            [slugModule],
            (err, result) => {
                if (err) {
                    console.error('Error getting projects:', err);
                    return reject(err);
                }
                if (result.length > 0) {
                    resolve(result[0].project);
                } else {
                    resolve(null);
                }
            }
        );
    });
}

module.exports = { addModule, updateModule, getAllModules, getModuleBySlug, getModuleById, getModuleByCourseId, removeModule, removeModuleById, getProjectByModuleId };