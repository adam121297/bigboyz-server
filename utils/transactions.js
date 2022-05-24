const { getFirestore } = require('firebase-admin/firestore');

exports.create = async (transactionId, transaction) => {
  const firestore = getFirestore();

  try {
    await firestore
      .collection('transactions')
      .doc(transactionId)
      .set(transaction);

    return true;
  } catch (error) {
    return false;
  }
};

exports.update = async (transactionId, status) => {
  const firestore = getFirestore();

  try {
    await firestore.collection('transactions').doc(transactionId).update({
      'payment.status': status
    });

    return true;
  } catch (error) {
    return false;
  }
};
