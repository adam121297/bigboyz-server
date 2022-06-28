const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const sendMessage = async (chatRoomId, message) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('messages')
      .doc(chatRoomId)
      .collection('message')
      .doc()
      .set({
        text: message.text,
        sender: message.sender,
        timestamp: message.timestamp
      });

    return true;
  } catch (error) {
    return { error };
  }
};

const createPendingChatRoom = async (chatRoomId, chatRoom) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('pendingChatRooms')
      .doc(chatRoomId)
      .set({ ...chatRoom });

    return true;
  } catch (error) {
    return { error };
  }
};

const updatePendingChatRoom = async (chatRoomId, chatRoom) => {
  try {
    const firestore = getFirestore();

    await firestore
      .collection('pendingChatRooms')
      .doc(chatRoomId)
      .update({ ...chatRoom });

    return true;
  } catch (error) {
    return { error };
  }
};

exports.createRoom = async (chatRoomId, chatRoom) => {
  try {
    const firestore = getFirestore();

    const data = await firestore
      .collection('users')
      .doc(chatRoom.client.id)
      .collection('chatRooms')
      .doc(chatRoomId)
      .get();

    if (data.exists) {
      const existingData = data.data();
      const currentTimestamp = Date.now();

      const isPending = existingData.expiredAt === 0;
      const isExpired = existingData.expiredAt < currentTimestamp;

      if (isPending) {
        sendMessage(chatRoomId, {
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        updatePendingChatRoom(chatRoomId, {
          name: chatRoom.name,
          image: chatRoom.image,
          client: chatRoom.client,
          duration: FieldValue.increment(chatRoom.duration),
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.client.id)
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            ...chatRoom,
            counter: FieldValue.increment(1)
          });
      } else if (isExpired) {
        sendMessage(chatRoomId, {
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        createPendingChatRoom(chatRoomId, {
          name: chatRoom.name,
          image: chatRoom.image,
          client: chatRoom.client,
          duration: chatRoom.duration,
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.client.id)
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
          .doc(chatRoom.client.id)
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
      sendMessage(chatRoomId, {
        text: chatRoom.latestMessage.text,
        sender: chatRoom.latestMessage.sender,
        timestamp: chatRoom.latestMessage.timestamp
      });

      createPendingChatRoom(chatRoomId, {
        name: chatRoom.name,
        image: chatRoom.image,
        client: chatRoom.client,
        duration: chatRoom.duration,
        timestamp: chatRoom.latestMessage.timestamp
      });

      await firestore
        .collection('users')
        .doc(chatRoom.client.id)
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

exports.acceptPending = async (chatRoomId, adminId) => {
  try {
    const firestore = getFirestore();
    const pendingChatRoomRef = firestore
      .collection('pendingChatRooms')
      .doc(chatRoomId);

    const pendingChatRoom = (await pendingChatRoomRef.get()).data();

    const client = pendingChatRoom.client;
    const duration = pendingChatRoom.duration;
    const durationTimestamp = pendingChatRoom.duration * 60 * 60 * 1000;

    const clientChatRoomRef = firestore
      .collection('users')
      .doc(client.id)
      .collection('chatRooms')
      .doc(chatRoomId);

    await clientChatRoomRef.update({
      duration,
      expiredAt: FieldValue.increment(durationTimestamp)
    });

    const clientChatRoom = (await clientChatRoomRef.get()).data();

    await firestore
      .collection('users')
      .doc(adminId)
      .collection('chatRooms')
      .doc(chatRoomId)
      .set(clientChatRoom);

    await pendingChatRoomRef.delete();

    return true;
  } catch (error) {
    return { error };
  }
};
