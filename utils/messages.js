const { getDatabase } = require('firebase-admin/database');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

exports.createRoom = async (chatRoomId, chatRoom) => {
  try {
    const database = getDatabase();
    const firestore = getFirestore();

    const data = await firestore
      .collection('users')
      .doc(chatRoom.users[0])
      .collection('chatRooms')
      .doc(chatRoomId)
      .get();

    if (data.exists) {
      const existingData = data.data();
      const currentTimestamp = Date.now();

      const isPending = existingData.expiredAt === 0;
      const isExpired = existingData.expiredAt < currentTimestamp;

      if (isPending) {
        const ref = database.ref(`messages/${chatRoomId}`).push();
        ref.set({
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.users[0])
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            ...chatRoom,
            duration: FieldValue.increment(chatRoom.duration),
            counter: FieldValue.increment(1)
          });
      } else if (isExpired) {
        const ref = database.ref(`messages/${chatRoomId}`).push();
        ref.set({
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.users[0])
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            ...chatRoom,
            counter: FieldValue.increment(1),
            expiredAt: 0
          });
      } else {
        await firestore
          .collection('users')
          .doc(chatRoom.users[0])
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            name: chatRoom.name,
            image: chatRoom.image,
            expiredAt: FieldValue.increment(chatRoom.duration * 60 * 60 * 1000),
            duration: FieldValue.increment(chatRoom.duration)
          });
      }
    } else {
      const ref = database.ref(`messages/${chatRoomId}`).push();
      ref.set({
        text: chatRoom.latestMessage.text,
        sender: chatRoom.latestMessage.sender,
        timestamp: chatRoom.latestMessage.timestamp
      });

      await firestore
        .collection('users')
        .doc(chatRoom.users[0])
        .collection('chatRooms')
        .doc(chatRoomId)
        .set({
          ...chatRoom,
          counter: 1
        });
    }

    return true;
  } catch (error) {
    return { error };
  }
};
