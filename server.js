require('dotenv').config();
const express = require('express');
const database = require('./DatabaseSetUp');
const course = require('./Course');
const user = require('./User');
const moduleTable = require('./Module');
const DetailProject = require('./DetailProject');
const chapter = require('./Chapter');
const userEnroll = require('./UserEnroll');
const multer = require('multer');
const path = require('path');
const uploadFile = require('./cobas3'); // Import the S3 upload function
const Memcached = require('memcached');
const jwt = require('jsonwebtoken');
const { addUserChapter, fetchChapters } = require('./UserChapter');

const memcached = new Memcached(process.env.ELASTICACHE_ENDPOINT || 'localhost:11211');
const app = express();
const cors = require("cors");
const connection = require('./Connection');
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options('*', cors());

database.createTable();

app.use(express.json());

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const checkToken = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).send({ message: 'Token is required' });
    }

    try {
        const tokenOnly = token.replace('Bearer ', '');
        const decoded = jwt.verify(tokenOnly, process.env.JWT_SECRET);
        next();
    } catch (error) {
        console.log(error);
        return res.status(403).send({ message: 'Invalid token' });
    }
};

app.get('/', checkToken, (req, res) => {
    res.send('Hello World');
});

app.get('/health', (req, res) => {
    res.send('OK');
});

// CRUD course
app.post('/add/course', checkToken, upload.single('image'), async (req, res) => {
    const { name, slug, link, description } = req.body;
    const cacheKey = 'courses';

    try {
        // Add course data to the database
        const newCourse = await course.addCourse(name, link, slug, description);
        const courses = await course.getCourses();
        memcached.set(cacheKey, JSON.stringify(courses), 600, (err) => {
            if (err) {
                console.error('Error setting value in Memcached:', err);
            }
        });

        res.status(201).send(newCourse);

    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({ error: 'Error adding course' });
    }
});


app.post('/update/course', checkToken, async (req, res) => {
    const { id, name, link, slug, description } = req.body;
    const cacheKey = 'courses';
    console.log(link);

    try {
        const updatedCourse = await course.updateCourse(id, name, link, slug, description);

        const courses = await course.getCourses();

        memcached.set(cacheKey, JSON.stringify(courses), 600, (err) => {
            if (err) {
                console.error('Error updating value in Memcached:', err);
            }
        });

        res.status(200).send(updatedCourse);

    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).send({ error: 'Error updating course' });
    }
});

app.get('/courses', checkToken, async (req, res) => {
    const cacheKey = 'courses';

    const data = await new Promise((resolve, reject) => {
        memcached.get(cacheKey, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });

    if (data) {
        return res.status(200).send(JSON.parse(data));
    } else {
        const courses = await course.getCourses();
        await new Promise((resolve, reject) => {
            memcached.set(cacheKey, JSON.stringify(courses), 600, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        return res.status(200).send(courses);
    }

});


app.get('/course/:slug', checkToken, async (req, res) => {
    const cacheKey = `course:${req.params.slug}`;

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                return res.status(200).send(JSON.parse(data));
            } else {
                course.getCourse(req.params.slug).then(course_slug => {
                    if (!course_slug.length) {
                        return res.status(404).send({ error: 'Course not found' });
                    }
                    memcached.set(cacheKey, JSON.stringify(course_slug), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(course_slug);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting course' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting course' });
    }
});


app.delete('/delete/course/:slug', checkToken, async (req, res) => {
    try {
        const delete_course = await course.deleteCourse(req.params.slug);
        res.status(200).send(delete_course);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting course' });
    }
});

app.post('/delete/course', checkToken, async (req, res) => {
    const cacheKey = 'courses';
    try {
        const id = req.body.id;
        const delete_course = await course.deleteCourseById(id);
        if (delete_course) {
            const courses = await course.getCourses();
            await new Promise((resolve, reject) => {
                memcached.set(cacheKey, JSON.stringify(courses), 600, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }
        res.status(200).send({ message: 'Course deleted successfully', data: delete_course });

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
        if (error.error === 'Username already exists') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: 'Error adding user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('username:', username);
    console.log('password', password);
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
app.post('/add/module', checkToken, async (req, res) => {
    const { course_id, name, link, slug, description, project } = req.body;
    const cacheKey = `module:course:${course_id}`;
    const cacheKey2 = 'modules';
    console.log('cacheKey:', cacheKey);

    try {
        const newModule = await moduleTable.addModule(course_id, name, link, slug, description, project);
        const modules = await moduleTable.getModuleByCourseId(course_id);

        memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
            if (err) {
                console.error('Error updating cache in Memcached:', err);
            }
        });

        const allModules = await moduleTable.getAllModules();
        memcached.set(cacheKey2, JSON.stringify(allModules), 600, (err) => {
            if (err) {
                console.error('Error updating cache in Memcached:', err);
            }
        });

        res.status(201).send(newModule);

    } catch (error) {
        console.error('Error adding module:', error);
        res.status(500).send({ error: 'Error adding module' });
    }
});

app.post('/update/module', checkToken, async (req, res) => {
    const { id, courseId, name, link, slug, description, project } = req.body;
    const cacheKey = `module:course:${courseId}`;
    const cacheKey2 = 'modules';

    try {

        const updatedModule = await moduleTable.updateModule(id, name, link, slug, description, project);
        const modules = await moduleTable.getModuleByCourseId(courseId);

        memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
            if (err) {
                console.error('Error updating module cache in Memcached:', err);
            }
        });

        const allModules = await moduleTable.getAllModules();
        memcached.set(cacheKey2, JSON.stringify(allModules), 600, (err) => {
            if (err) {
                console.error('Error updating module cache in Memcached:', err);
            }
        });

        res.status(200).send(updatedModule);

    } catch (error) {
        console.error('Error updating module:', error);
        res.status(500).send({ error: 'Error updating module' });
    }
});



app.get('/modules', checkToken, async (req, res) => {
    const cacheKey = 'modules';

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            }
            else {
                moduleTable.getAllModules().then(modules => {
                    memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(modules);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting modules' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting modules' });
    }
});

app.get('/module/:slug', checkToken, async (req, res) => {
    const cacheKey = `module:${req.params.slug}`;
    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            }
            try {
                const module_slug = moduleTable.getModuleBySlug(req.params.slug);

                if (!module_slug.length) {
                    return res.status(404).send({ error: 'Module not found' });
                }

                // Simpan ke cache
                memcached.set(cacheKey, JSON.stringify(module_slug), 600, (err) => {
                    if (err) {
                        console.error('Error setting value in Memcached:', err);
                    }
                });

                // Kirim data ke klien
                return res.status(200).send(module_slug);
            } catch (error) {
                return res.status(500).send({ error: 'Error getting module' });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});

app.get('/module/get/:idModule', checkToken, async (req, res) => {
    const cacheKey = `module:${req.params.idModule}`;

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            }
            else {
                moduleTable.getModuleById(req.params.idModule).then(module_id => {
                    if (!module_id.length) {
                        return res.status(404).send({ error: 'Module not found' });
                    }
                    memcached.set(cacheKey, JSON.stringify(module_id), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(module_id);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting module' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});


app.get('/module/course/:course_id', checkToken, async (req, res) => {

    const cacheKey = `module:course:${req.params.course_id}`;
    console.log('cacheKey:', cacheKey);

    try {

        memcached.get(cacheKey, (err, data) => {
            if (err) {
                res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                res.status(200).send(JSON.parse(data));
            } else {
                moduleTable.getModuleByCourseId(req.params.course_id).then(module_course => {
                    if (!module_course.length) {
                        return res.status(404).send({ error: 'Module not found' });
                    }
                    memcached.set(cacheKey, JSON.stringify(module_course), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(module_course);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting module' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});

app.delete('/delete/module/:slug', checkToken, async (req, res) => {
    try {
        const delete_module = await moduleTable.removeModule(req.params.slug);
        res.status(200).send(delete_module);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting module' });
    }
});

app.post('/delete/module', checkToken, async (req, res) => {
    try {
        const id = req.body.id;
        const idCourse = req.body.idCourse;
        const delete_module = await moduleTable.removeModuleById(id);

        if (delete_module) {
            const cacheKey = `modules`;
            const cacheKey2 = `module:course:${idCourse}`;

            const modules = await moduleTable.getAllModules();

            await new Promise((resolve, reject) => {
                memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            await new Promise((resolve, reject) => {
                memcached.set(cacheKey2, JSON.stringify(modules), 600, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        res.status(200).send(delete_module);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting module' });
    }
});

// CRUD chapter
app.post('/add/chapter', checkToken, async (req, res) => {
    const { module_id, name, type, content } = req.body;
    const cacheKey = `chapters:module:${module_id}`;

    try {
        const newChapter = await chapter.addChapter(module_id, name, type, content);
        const chapters = await chapter.getChapterByModuleId(module_id);

        memcached.set(cacheKey, JSON.stringify(chapters), 600, (err) => {
            if (err) {
                console.error('Error updating chapter cache in Memcached:', err);
            }
        });

        res.status(201).send(newChapter);

    } catch (error) {
        console.error('Error adding chapter:', error);
        res.status(500).send({ error: 'Error adding chapter' });
    }
});

app.post('/update/chapter', checkToken, async (req, res) => {
    try {
        const { id, name, type, content } = req.body;
        const updatedChapter = await chapter.updateChapter(id, name, type, content);
        res.status(200).send(updatedChapter);
    } catch (error) {
        res.status(500).send({ error: 'Error updating chapter' });
    }
});

app.get('/chapters', checkToken, async (req, res) => {

    const cacheKey = 'chapters';

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            } else {
                chapter.getAllChapters().then(chapters => {
                    memcached.set(cacheKey, JSON.stringify(chapters), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(chapters);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting chapters' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting chapters' });
    }
});

app.get('/chapter/:id', checkToken, async (req, res) => {

    const cacheKey = `chapter:${req.params.id}`;

    try {

        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            } else {
                chapter.getChapterById(req.params.id).then(chapter_id => {
                    if (!chapter_id.length) {
                        return res.status(404).send({ error: 'Chapter not found' });
                    }
                    memcached.set(cacheKey, JSON.stringify(chapter_id), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                            res.status(500).send({ error: 'Error getting chapter' });
                        }
                    });

                    res.status(200).send(chapter_id);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting chapter' });
                });
            }
        });

        const chapter_id = await chapter.getChapterById(req.params.id);
        if (!chapter_id.length) {
            return res.status(404).send({ error: 'Chapter not found' });
        }
        res.status(200).send(chapter_id);
    } catch (error) {
        res.status(500).send({ error: 'Error getting chapter' });
    }
});

app.get('/modules/:module_id/chapters', async (req, res) => {

    const cacheKey = `chapters:module:${req.params.module_id}`;

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
            } else {
                chapter.getChapterByModuleId(req.params.module_id).then(chapters => {
                    memcached.set(cacheKey, JSON.stringify(chapters), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(chapters);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting chapters' });
                });
            }
        });
    } catch (error) {
        res.status(500).send({ error: 'Error getting chapters' });
    }

});


app.post('/delete/chapter', checkToken, async (req, res) => {
    try {
        const id = req.body.id;
        const module_id = req.body.module_id;
        const delete_chapter = await chapter.removeChapterById(id);
        const cacheKey = `chapters:module:${module_id}`;

        if (delete_chapter) {

            const modules = await chapter.getChapterByModuleId(module_id);

            await new Promise((resolve, reject) => {
                memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        }

        res.status(200).send(delete_chapter);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting chapter' });
    }
});

app.post("/modules/:moduleId/user-chapters", checkToken, async (req, res) => {
    const userId = req.body.userId; // User ID from query params
    const moduleId = req.body.moduleId; // Module ID from route params

    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }

    try {
        const chapters = await fetchChapters(userId, moduleId);
        res.json(chapters);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/module/:moduleId/projects', checkToken, async (req, res) => {
    const { moduleId } = req.params;

    try {
        const projects = await moduleTable.getProjectByModuleId(moduleId);

        if (!projects || projects.length === 0) {
            return res.status(404).send({ message: 'No projects found for this module.' });
        }

        return res.status(200).send(projects);
    } catch (error) {
        console.error('Error fetching projects by module:', error.message);
        return res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/enroll', checkToken, async (req, res) => {
    const { userId, moduleId, checkOnly } = req.body;

    try {
        // Check if the user has an active enrollment
        const activeEnrollments = await userEnroll.checkActiveEnrollment(userId);

        if (checkOnly) {
            // Return a boolean response if it's a "check only" request
            const isEnrolled = activeEnrollments.some((enrollment) => enrollment.module_id == moduleId);
            return res.status(200).json({ isEnrolled });
        }

        if (activeEnrollments.length > 0) {
            return res.status(400).json({
                message: 'You must complete your current module before enrolling in a new one.',
            });
        }

        // Enroll the user in a new module
        const newEnrollment = await userEnroll.enrollUser(userId, moduleId);
        res.status(201).json({
            message: 'Successfully enrolled in module.',
            enrollment: newEnrollment,
        });
    } catch (error) {
        console.error('Error enrolling user:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

app.get('/projects/:idModule', async (req, res) => {
    const { idModule } = req.params;
    try {
        const projectDetails = await DetailProject.getProjectDetails(idModule);
        res.status(200).json(projectDetails);
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

app.post('/project/update/', async (req, res) => {
    const { id, comment, score } = req.body;

    try {
        const updateResponse = await DetailProject.updateProject(id, comment, score);
        res.status(200).json(updateResponse);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// API Endpoint to submit a project
app.post('/project/submit', async (req, res) => {
    const { idUser, idModule, link } = req.body;

    try {
        const submitResponse = await DetailProject.submitProject(idUser, idModule, link);
        res.status(201).json(submitResponse);
    } catch (error) {
        console.error('Error submitting project:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

app.get('/modules/:moduleSlug', async (req, res) => {
    const { moduleSlug } = req.params;

    try {
        const moduleId = await moduleTable.getModuleIdBySlug(moduleSlug);
        res.status(200).json({ module_id: moduleId });
    } catch (error) {
        if (error.message === 'Module not found') {
            return res.status(404).json({ message: 'Module not found' });
        }
        console.error('Error fetching module:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// API user chapter progress
app.post("/user-chapter", async (req, res) => {
    const { userId, chapterId, status } = req.body;
    if (!userId || !chapterId || !status) {
        return res.status(400).json({ error: "Missing required fields" });
    }
    try {
        const response = await addUserChapter(userId, chapterId, status);
        res.json(response);
    } catch (error) {
        console.error("Error handling user chapter request:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get('/detail-projects/submitted', async (req, res) => {
    const { idUser, idModule } = req.query;

    try {
        const projectCheck = await DetailProject.getProjectByUser(idUser, idModule);
        res.status(200).json({ module_id: projectCheck });
    } catch (error) {
        if (error.message === 'Module not found') {
            return res.status(404).json({ message: 'Module not found' });
        }
        console.error('Error fetching module:', error);
        res.status(500).json({ message: 'Server error' });
    }
});




// Complete module endpoint
app.post('/complete-module', async (req, res) => {
    const { userId, moduleId } = req.body;

    console.log('Received complete-chapters request:', { userId, moduleId });

    if (!userId || !moduleId) {
        return res.status(400).json({ error: 'userId and moduleId are required' });
    }

    try {
        const result = await userEnroll.completeEnrollment(userId, moduleId);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating user_enrollments:', error);
        res.status(500).json({ error: 'An error occurred while updating enrollment' });
    }
});


app.post("/user-enrollment-status", async (req, res) => {
    const { userId, moduleId } = req.body; // Read from request body
    console.log('Received user-enrollment-status request:', { userId, moduleId });

    if (!userId || !moduleId) {
        return res.status(400).json({ error: "userId and moduleId are required" });
    }

    try {
        const [rows] = await connection.promise().query(
            "SELECT completed FROM user_enrollments WHERE user_id = ? AND module_id = ?",
            [userId, moduleId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "No enrollment found for given userId and moduleId" });
        }

        const { completed } = rows[0];
        res.json({ completed });
    } catch (err) {
        console.error("Error fetching user enrollment status:", err);
        res.status(500).json({ error: "An error occurred while checking enrollment status" });
    }
});



