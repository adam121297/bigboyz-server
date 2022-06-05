const { getFirestore, FieldValue } = require('firebase-admin/firestore');

exports.save = async (userId, user, FCMToken) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('users')
      .doc(userId)
      .set({
        name: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        status: 'Online',
        FCMTokens: FieldValue.arrayUnion(FCMToken)
      });

    return true;
  } catch (error) {
    console.log('User update error: ', error);
    return { error };
  }
};
