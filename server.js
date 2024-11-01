const express = require('express');
const database = require('./DatabaseSetUp');
const course = require('./Course');
const user = require('./User');
const moduleTable = require('./Module');

const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

database.createTable();

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// const checkToken = async (req, res, next) => { 
//     const token = req.headers.authorization;

//     if (!token) {
//         return res.status(401).send({ message: 'Token is required' });
//     }
    
//     try {
//         const tokenOnly = token.replace('Bearer ', '');
//         const user = await User.findOne({ token: tokenOnly });
//         if (!user) {
//             return res.status(403).send({ message: 'Invalid token' });
//         }
//         next();
//     } catch (error) {
//         console.log(error);
//         return res.status(403).send({ message: 'Invalid token' });
//     }
// };

app.get('/', (req, res) => {
    res.send('Hello World');
});

// CRUD course
app.post('/add/course', async (req, res) => {
    const { name, link, slug, description } = req.body;
    try {
        const newcourse = await course.addCourse(name, link, slug, description);
        res.status(201).send(newcourse);
    } catch (error) {
        res.status(500).send({ error: 'Error adding course' });
    }
});

app.post('/update/course', async (req, res) => {
    const { id, name, link, slug, description } = req.body;
    try {
        const updatedCourse = await course.updateCourse(id, name, link, slug, description);
        res.status(200).send(updatedCourse);
    } catch (error) {
        res.status(500).send({ error: 'Error updating course' });
    }
});

app.get('/courses', async (req, res) => {
    try {
        const courses = await course.getCourses();
        res.status(200).send(courses);
    } catch (error) {
        res.status(500).send({ error: 'Error getting courses' });
    }
});

app.get('/course/:slug', async (req, res) => {
    try {
        const course_slug = await course.getCourse(req.params.slug);
        if (!course_slug.length) {
            return res.status(404).send({ error: 'Course not found' });
        }
        res.status(200).send(course_slug);
    } catch (error) {
        res.status(500).send({ error: 'Error getting course' });
    }
});

app.delete('/delete/course/:slug', async (req, res) => {
    try {
        const delete_course = await course.deleteCourse(req.params.slug);
        res.status(200).send(delete_course);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting course' });
    }
});

// CRUD user
app.post('/add/user', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const newUser = await user.addUser(username, password);
        return res.status(201).json(newUser); 
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ error: 'Error adding user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const loginUser = await user.loginUser(username, password);
        if (!loginUser) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        res.status(200).json(loginUser); 
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Error logging in' }); 
    }
});

// CRUD module
app.post('/add/module', async (req, res) => {
    const { course_id, name, link, slug, description, project } = req.body;
    try {
        const newModule = await moduleTable.addModule(course_id, name, link, slug, description, project);
        res.status(201).send(newModule);
    } catch (error) {
        res.status(500).send({ error: 'Error adding module' });
    }
});

app.post('/update/module', async (req, res) => {
    const { id, name, link, slug, description, project } = req.body;
    try {
        const updatedModule = await moduleTable.updateModule(id, name, link, slug, description, project);
        res.status(200).send(updatedModule);
    } catch (error) {
        res.status(500).send({ error: 'Error updating module' });
    }
});

app.get('/modules', async (req, res) => {
    try {
        const modules = await moduleTable.getAllModules();
        res.status(200).send(modules);
    } catch (error) {
        res.status(500).send({ error: 'Error getting modules' });
    }
});

app.get('/module/:slug', async (req, res) => {
    try {
        const module_slug = await moduleTable.getModuleBySlug(req.params.slug);
        if (!module_slug.length) {
            return res.status(404).send({ error: 'Module not found' });
        }
        res.status(200).send(module_slug);
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});

app.get('/module/get/:idModule', async (req, res) => {
    try {
        const module_id = await moduleTable.getModuleById(req.params.idModule);
        if (!module_id.length) {
            return res.status(404).send({ error: 'Module not found' });
        }
        res.status(200).send(module_id);
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});


app.get('/module/course/:course_id', async (req, res) => {
    try {
        const module_course = await moduleTable.getModuleByCourseId(req.params.course_id);
        if (!module_course.length) {
            return res.status(404).send({ error: 'Module not found' });
        }
        res.status(200).send(module_course);
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});

app.delete('/delete/module/:slug', async (req, res) => {
    try {
        const delete_module = await moduleTable.removeModule(req.params.slug);
        res.status(200).send(delete_module);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting module' });
    }
});

