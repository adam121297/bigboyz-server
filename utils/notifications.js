const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const removeInvalidToken = async (userId, FCMTokens) => {
  try {
    const firestore = getFirestore();

    const userRef = firestore.collection('users').doc(userId);

    FCMTokens.forEach((token) =>
      userRef.update({ FCMTokens: FieldValue.arrayRemove(token) })
    );
  } catch (error) {
    return { error };
  }
};

exports.send = async (userId, messageTitle, messageBody) => {
  try {
    const firestore = getFirestore();
    const messaging = getMessaging();

    const userRef = firestore.collection('users').doc(userId);
    const user = (await userRef.get()).data();

    if (user) {
      const response = await messaging.sendToDevice(
        user.FCMTokens,
        {
          notification: {
            body: messageBody,
            title: messageTitle
          }
        },
        { priority: 'high' }
      );

      const FCMTokens = user.FCMTokens;
      const invalidFCMTokens = [];

      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            invalidFCMTokens.push(FCMTokens[index]);
          }
        }
      });

      removeInvalidToken(userId, invalidFCMTokens);
    }

    return true;
  } catch (error) {
    return { error };
  }
};
