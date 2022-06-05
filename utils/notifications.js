const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

exports.send = async (userId, messageTitle, messageBody) => {
  const firestore = getFirestore();
  const messaging = getMessaging();

  const rawData = await firestore.collection('users').doc(userId).get();
  const user = rawData.data();

  await messaging.send({
    tokens: user.FCMTokens,
    notification: {
      body: messageBody,
      title: messageTitle
    }
  });

  return true;
};
