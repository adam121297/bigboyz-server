const { getFirestore } = require('firebase-admin/firestore');

exports.save = async (userId, user) => {
  const firestore = getFirestore();
  const node = firestore.collection('users').doc(userId);

  const rawData = await node.get();

  if (!rawData.exists) {
    await node.set({
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL,
      status: 'Online'
    });
  }

  return true;
};
