const { getFirestore, FieldValue } = require('firebase-admin/firestore');

exports.save = async (userId, user) => {
  const firestore = getFirestore();

  await firestore
    .collection('users')
    .doc(userId)
    .set({
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      status: 'Online',
      FCMTokens: FieldValue.arrayUnion(user.FCMToken)
    });

  return true;
};
