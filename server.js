require('dotenv').config();
const express = require('express');
const database = require('./DatabaseSetUp');
const course = require('./Course');
const user = require('./User');
const moduleTable = require('./Module');
const chapter = require('./Chapter');
const multer = require('multer');
const path = require('path');
const uploadFile = require('./cobas3'); // Import the S3 upload function
const Memcached = require('memcached');
const jwt = require('jsonwebtoken');

const memcached = new Memcached(process.env.ELASTICACHE_ENDPOINT || 'localhost:11211');
const app = express();
const cors = require("cors");
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
app.post('/add/course', upload.single('image'), async (req, res) => {
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


app.post('/update/course', async (req, res) => {
    const { id, name, link, slug, description } = req.body;
    const cacheKey = 'courses';

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

app.get('/courses', async (req, res) => {
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


app.get('/course/:slug', async (req, res) => {
    const cacheKey = `course:${req.params.slug}`;

    try {
        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
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
app.post('/add/module', async (req, res) => {
    const { course_id, name, link, slug, description, project } = req.body;
    const cacheKey = `module:course:${course_id}`;
    console.log('cacheKey:', cacheKey);

    try {
        const newModule = await moduleTable.addModule(course_id, name, link, slug, description, project);
        const modules = await moduleTable.getModuleByCourseId(course_id);

        memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
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

app.post('/update/module', async (req, res) => {
    const { id, courseId, name, link, slug, description, project } = req.body;
    const cacheKey = `module:course:${courseId}`; 

    try {
        
        const updatedModule = await moduleTable.updateModule(id, name, link, slug, description, project);
        const modules = await moduleTable.getModuleByCourseId(courseId);
        
        memcached.set(cacheKey, JSON.stringify(modules), 600, (err) => {
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



app.get('/modules', async (req, res) => {
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

app.get('/module/:slug', async (req, res) => {
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
            else {
                moduleTable.getModuleBySlug(req.params.slug).then(module_slug => {
                    if (!module_slug.length) {
                        return res.status(404).send({ error: 'Module not found' });
                    }
                    memcached.set(cacheKey, JSON.stringify(module_slug), 600, (err) => {
                        if (err) {
                            console.error('Error setting value in Memcached:', err);
                        }
                    });

                    res.status(200).send(module_slug);
                }).catch(error => {
                    res.status(500).send({ error: 'Error getting module' });
                });
            }

        });
        res.status(200).send(module_slug);
    } catch (error) {
        res.status(500).send({ error: 'Error getting module' });
    }
});

app.get('/module/get/:idModule', async (req, res) => {
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


app.get('/module/course/:course_id', async (req, res) => {

    const cacheKey = `module:course:${req.params.course_id}`;
    console.log('cacheKey:', cacheKey);

    try {

        memcached.get(cacheKey, (err, data) => {
            if (err) {
                return res.status(500).send({ error: 'Error retrieving value from Memcached' });
            }

            if (data) {
                // console.log('Data from Memcached:', data);
                return res.status(200).send(JSON.parse(data));
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

app.delete('/delete/module/:slug', async (req, res) => {
    try {
        const delete_module = await moduleTable.removeModule(req.params.slug);
        res.status(200).send(delete_module);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting module' });
    }
});

app.delete('/delete/module/id/:idModule', async (req, res) => {
    try {
        const delete_module = await moduleTable.removeModuleById(req.params.idModule);
        res.status(200).send(delete_module);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting module' });
    }
});

// CRUD chapter
app.post('/add/chapter', async (req, res) => {
    const { module_id, name, type, content } = req.body;
    const cacheKey = `chapters:module:${module_id}`; 

    try {
        const newChapter = await chapter.addChapter(module_id, name, type, content);
        const chapters = await chapter.getChaptersByModuleId(module_id);

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

app.post('/update/chapter', async (req, res) => {
    try {
        const { id, name, type, content } = req.body;
        const updatedChapter = await chapter.updateChapter(id, name, type, content);
        res.status(200).send(updatedChapter);
    } catch (error) {
        res.status(500).send({ error: 'Error updating chapter' });
    }
});

app.get('/chapters', async (req, res) => {

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

app.get('/chapter/:id', async (req, res) => {

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


app.delete('/delete/chapter/:id', async (req, res) => {
    try {
        const delete_chapter = await chapter.removeChapterById(req.params.id);
        res.status(200).send(delete_chapter);
    } catch (error) {
        res.status(500).send({ error: 'Error deleting chapter' });
    }
});

app.get('/modules/:moduleId/chapters', async (req, res) => {
    const { moduleId } = req.params;

    try {
        const chapters = await chapter.getChaptersByModuleId(moduleId);

        if (!chapters || chapters.length === 0) {
            return res.status(404).send({ message: 'No chapters found for this module.' });
        }

        return res.status(200).send(chapters);
    } catch (error) {
        console.error('Error fetching chapters by module:', error.message);
        return res.status(500).send({ message: 'Internal Server Error', error: error.message });
    }
});

    app.get('/module/:moduleId/projects', async (req, res) => {
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


