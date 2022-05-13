require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
var admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://bigboyz-3f8ca-default-rtdb.firebaseio.com'
});

const app = express();
app.use(bodyParser.json());
require('./routers')(app);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
