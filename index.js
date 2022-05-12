require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
require('./routers')(app);

const port = 5000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
