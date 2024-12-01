const connection = require('./Connection');

connection.connect(err => {
    if (err) {
        console.error('Error connecting to RDS:', err);
        return;
    }
    console.log('Connected to Local');
});


function createTable() {
    const createUserTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        token TEXT NOT NULL
    );
    `;
    connection.query(createUserTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('User Table created');
    });

    const createCourseTable = `
    CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        link TEXT NOT NULL,
        description TEXT NOT NULL
    );
    `;

    connection.query(createCourseTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Course Table created');
    });

    const createModuleTable = `
    CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        FOREIGN KEY (course_id) REFERENCES courses(id),
        name VARCHAR(255) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        link TEXT NOT NULL,
        project TEXT NOT NULL
    );
    `;

    connection.query(createModuleTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Module Table created');
    });

    const createChapterTable = `
    CREATE TABLE IF NOT EXISTS chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        FOREIGN KEY (module_id) REFERENCES modules(id),
        name VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(255) NOT NULL,
        content TEXT NOT NULL
    );
    `;

    connection.query(createChapterTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Chapter Table created');
    });

    const createDetailProjectTable = `
    CREATE TABLE IF NOT EXISTS detail_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        FOREIGN KEY (module_id) REFERENCES modules(id),
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        link TEXT NOT NULL,
        comment TEXT,
        score INT
    );
    `;

    connection.query(createDetailProjectTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Detail Project Table created');
    });

    const createUserChapter = `
    CREATE TABLE IF NOT EXISTS user_chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        chapter_id INT NOT NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id),
        status BOOLEAN NOT NULL,
        score INT
    );
    `;

    connection.query(createUserChapter, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Detail Project Table created');
    });


    const createUserEnrollmentsTable = `
    CREATE TABLE IF NOT EXISTS user_enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (module_id) REFERENCES modules(id),
        UNIQUE(user_id, module_id)
    );
    `;

    connection.query(createUserEnrollmentsTable, (err, result) => {
        if (err) {
            console.error("Error creating user_enrollments table:", err);
            return;
        }
        console.log("User Enrollments Table created");
    });
}

module.exports = { createTable };




