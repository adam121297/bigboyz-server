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
      .doc(chatRoom.users[0].id)
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
          users: chatRoom.users,
          duration: FieldValue.increment(chatRoom.duration),
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.users[0].id)
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            ...chatRoom,
            duration: 0,
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
          users: chatRoom.users,
          duration: chatRoom.duration,
          timestamp: chatRoom.latestMessage.timestamp
        });

        await firestore
          .collection('users')
          .doc(chatRoom.users[0].id)
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            ...chatRoom,
            duration: 0,
            counter: FieldValue.increment(1),
            expiredAt: 0
          });
      } else {
        sendMessage(chatRoomId, {
          text: 'Durasi konsultasi telah diperpanjang',
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        firestore
          .collection('users')
          .doc(chatRoom.users[1].id)
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            name: chatRoom.name,
            image: chatRoom.image,
            latestMessage: {
              text: 'Durasi konsultasi telah diperpanjang',
              sender: chatRoom.latestMessage.sender,
              timestamp: chatRoom.latestMessage.timestamp
            },
            counter: FieldValue.increment(1),
            expiredAt: FieldValue.increment(chatRoom.duration * 60 * 60 * 1000),
            duration: FieldValue.increment(chatRoom.duration)
          });

        await firestore
          .collection('users')
          .doc(chatRoom.users[0].id)
          .collection('chatRooms')
          .doc(chatRoomId)
          .update({
            name: chatRoom.name,
            image: chatRoom.image,
            latestMessage: {
              text: 'Durasi konsultasi telah diperpanjang',
              sender: chatRoom.latestMessage.sender,
              timestamp: chatRoom.latestMessage.timestamp
            },
            counter: FieldValue.increment(1),
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
        users: chatRoom.users,
        duration: chatRoom.duration,
        timestamp: chatRoom.latestMessage.timestamp
      });

      await firestore
        .collection('users')
        .doc(chatRoom.users[0].id)
        .collection('chatRooms')
        .doc(chatRoomId)
        .set({
          ...chatRoom,
          duration: 0,
          counter: 1
        });
    }

    return true;
  } catch (error) {
    return { error };
  }
};

exports.acceptPending = async (pendingChatRoom) => {
  try {
    const firestore = getFirestore();

    const admin = pendingChatRoom.users[0];
    const client = pendingChatRoom.users[1];
    const duration = pendingChatRoom.duration;
    const durationTimestamp = pendingChatRoom.duration * 60 * 60 * 1000;
    const currentTimestamp = Date.now();

    const clientChatRoomRef = firestore
      .collection('users')
      .doc(client.id)
      .collection('chatRooms')
      .doc(pendingChatRoom.id);

    const adminChatRoomRef = firestore
      .collection('users')
      .doc(admin.id)
      .collection('chatRooms')
      .doc(pendingChatRoom.id);

    const clientChatRoom = (await clientChatRoomRef.get()).data();

    await adminChatRoomRef.set({
      ...clientChatRoom,
      users: [admin, client]
    });

    if (clientChatRoom.expiredAt < currentTimestamp) {
      clientChatRoomRef.update({
        duration,
        expiredAt: currentTimestamp + durationTimestamp
      });
      adminChatRoomRef.update({
        duration,
        expiredAt: currentTimestamp + durationTimestamp
      });
    } else {
      clientChatRoomRef.update({
        duration: FieldValue.increment(duration),
        expiredAt: FieldValue.increment(durationTimestamp)
      });
      adminChatRoomRef.update({
        duration: FieldValue.increment(duration),
        expiredAt: FieldValue.increment(durationTimestamp)
      });
    }

    await firestore
      .collection('pendingChatRooms')
      .doc(pendingChatRoom.id)
      .delete();

    return true;
  } catch (error) {
    console.log(error);
  }
};
