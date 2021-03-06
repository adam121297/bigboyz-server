require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

const databaseURL = process.env.FIREBASE_DATABASE_URL;
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

require('./routers')(app);
require('./listeners')();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
