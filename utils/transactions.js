const { getFirestore } = require('firebase-admin/firestore');

/**
 * Create transaction data
 * @param {*} transactionId Transaction ID
 * @param {*} transaction Transaction data
 * @returns True
 */
exports.create = async (transactionId, transaction) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('transactions')
      .doc(transactionId)
      .set(transaction);

    return true;
  } catch (error) {
    console.log(error);
    return { error };
  }
};

/**
 * Update transaction status
 * @param {*} transactionId Transaction ID
 * @param {*} status Transaction status
 * @returns True
 */
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
