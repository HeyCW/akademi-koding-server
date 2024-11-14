const connection = require('./Connection');
const { S3Client, ListBucketsCommand, ListObjectsCommand } = require('@aws-sdk/client-s3');
const { fromIni } = require("@aws-sdk/credential-provider-ini");

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});

function addCourse(name, link, slug, description) {
    return new Promise((resolve, reject) => {
        connection.query(
            `INSERT INTO courses (name, link, slug, description) VALUES (?, ?, ?, ?)`,
            [name, link, slug, description],
            (err, result) => {
                if (err) {
                    console.error('Error adding course:', err);
                    return reject(err);
                }
 
                resolve({ 'id': result.insertId, 'name': name, 'link': link, 'slug': slug, 'description': description });
            }
        );
    });
}


function updateCourse(id, name, link, slug, description) {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE courses SET name = ?, description = ?, slug = ? WHERE id=?`,
            [name, description, slug, id],
            (err, result) => {
                if (err) {
                    console.error('Error updating course:', err);
                    return reject(err);
                }
                resolve({ message: 'Course updated' });
            }
        );
    });
}

function getCourses() {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM courses`, 
            (err, result) => {
                if (err) {
                    console.error('Error getting courses:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}

function getCourse(slug) {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT * FROM courses WHERE slug = ?`, 
            [slug],
            (err, result) => {
                if (err) {
                    console.error('Error getting course:', err);
                    return reject(err);
                }
                resolve(result);
            }
        );
    });
}


function deleteCourse(slug) {
    return new Promise((resolve, reject) => {
        connection.query(
            `DELETE FROM courses WHERE slug = ?`, 
            [slug],
            (err, result) => {
                if (err) {
                    console.error('Error deleting course:', err);
                    return reject(err);
                }
                resolve({ message: 'Course deleted' });
            }
        );
    });
}



module.exports = { addCourse, updateCourse, getCourses, getCourse, deleteCourse };



