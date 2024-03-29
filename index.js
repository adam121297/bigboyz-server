require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cron = require('node-cron');
const { check } = require('./utils/orders');

// CRON every night
cron.schedule('0 0 * * *', () => {
  check()
    .then((status) => {
      console.log(status);
    })
    .catch((error) => {
      return { error };
    });
});

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

require('./routers')(app);
require('./listeners')();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening to port ${port}...`));
