const { getFirestore } = require('firebase-admin/firestore');

exports.create = async (transactionId, transaction) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('transactions')
      .doc(transactionId)
      .set(transaction);

    return true;
  } catch (error) {
    return { error };
  }
};

exports.update = async (transactionId, status) => {
  try {
    const firestore = getFirestore();

    await firestore.collection('transactions').doc(transactionId).update({
      'payment.status': status
    });

    return true;
  } catch (error) {
    return { error };
  }
};

exports.get = async (transactionId) => {
  try {
    const firestore = getFirestore();

    const rawData = await firestore
      .collection('transactions')
      .doc(transactionId)
      .get();

    return rawData.data();
  } catch (error) {
    return { error };
  }
};
