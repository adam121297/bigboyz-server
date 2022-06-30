require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const notifications = require('./utils/notifications');
const midtrans = require('./utils/midtrans');

const databaseURL = process.env.FIREBASE_DATABASE_URL;
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL
});

const app = express();
app.use(bodyParser.json());
require('./routers')(app);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening to port ${port}...`));

const firestore = getFirestore();
firestore.collection('notifications').onSnapshot((snapshot) => {
  if (snapshot.empty) {
    return;
  }

  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      notifications.send(
        change.doc.data().receiver,
        change.doc.data().message.title,
        change.doc.data().message.text
      );

      change.doc.ref.delete().catch(() => {});
    }
  });
});

firestore.collection('transactions').onSnapshot((snapshot) => {
  if (snapshot.empty) {
    return;
  }

  snapshot.docChanges().forEach((change) => {
    if (change.type === 'modified') {
      if (change.doc.data().payment.status === 'cancel') {
        midtrans.cancel(change.doc.id);
      }
    }
  });
});
