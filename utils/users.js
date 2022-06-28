const { getFirestore, FieldValue } = require('firebase-admin/firestore');

exports.save = async (userId, user, FCMToken) => {
  try {
    const firestore = getFirestore();

    const userRef = firestore.collection('users').doc(userId);

    const isUserExist = (await userRef.get()).exists;

    if (!isUserExist) {
      await firestore
        .collection('users')
        .doc(userId)
        .set({
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          status: 'Online',
          FCMTokens: [FCMToken]
        });
    } else {
      await firestore
        .collection('users')
        .doc(userId)
        .update({
          name: user.displayName,
          email: user.email,
          avatar: user.photoURL,
          status: 'Online',
          FCMTokens: FieldValue.arrayUnion(FCMToken)
        });
    }

    return true;
  } catch (error) {
    return { error };
  }
};
