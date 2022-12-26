const { getFirestore } = require('firebase-admin/firestore');

exports.create = async (orderId, order) => {
  try {
    const firestore = getFirestore();

    await firestore.collection('orders').doc(orderId).set(order);

    return true;
  } catch (error) {
    return { error };
  }
};
