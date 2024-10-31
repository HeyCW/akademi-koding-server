const express = require('express');
const database = require('./DatabaseSetUp');

const app = express();
const PORT = process.env.PORT || 3000;



database.initState();
database.createTable();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
