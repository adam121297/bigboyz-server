const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

exports.send = async (userId, messageTitle, messageBody) => {
  try {
    const firestore = getFirestore();
    const messaging = getMessaging();

    const rawData = await firestore.collection('users').doc(userId).get();
    const user = rawData.data();

    await messaging.sendMulticast({
      tokens: user.FCMTokens,
      notification: {
        body: messageBody,
        title: messageTitle
      }
    });

    return true;
  } catch (error) {
    return { error };
  }
};
