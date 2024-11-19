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

    const createQuizTable = `
    CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chapter_id INT NOT NULL,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        choices TEXT NOT NULL,
        score INT NOT NULL
    );
    `;

    connection.query(createQuizTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Quiz Table created');
    });

    const createDetailQuizTable = `
    CREATE TABLE IF NOT EXISTS detail_quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        answer TEXT NOT NULL,
        score INT NOT NULL
    );
    `;

    connection.query(createDetailQuizTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Detail Quiz Table created');
    });

    const createDetailProjectTable = `
    CREATE TABLE IF NOT EXISTS detail_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        FOREIGN KEY (module_id) REFERENCES modules(id),
        user_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        link TEXT NOT NULL,
        coment TEXT,
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


}

module.exports = {createTable};




