const { getFirestore } = require('firebase-admin/firestore');

/**
 * Send message
 * @param {*} chatRoomId ChatRoom ID
 * @param {*} message Message data
 * @returns True
 */
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

/**
 * Create or update pendingChatRoom document
 * @param {*} chatRoomId ChatRoom ID
 * @param {*} chatRoom ChatRoom data
 * @returns True
 */
const createPending = async (chatRoomId, chatRoom) => {
  try {
    const firestore = getFirestore();

    const pendingChatRoomRef = firestore
      .collection('pendingChatRooms')
      .doc(chatRoomId);

    await firestore.runTransaction(async (transaction) => {
      const pendingChatRoom = (
        await transaction.get(pendingChatRoomRef)
      ).data();

      if (!pendingChatRoom) {
        transaction.set(pendingChatRoomRef, {
          name: chatRoom.name,
          image: chatRoom.image,
          users: chatRoom.users,
          duration: chatRoom.duration,
          timestamp: chatRoom.latestMessage.timestamp
        });

        return true;
      }

      const duration = pendingChatRoom.duration + chatRoom.duration;
      transaction.update(pendingChatRoomRef, {
        name: chatRoom.name,
        image: chatRoom.image,
        users: chatRoom.users,
        duration,
        timestamp: chatRoom.latestMessage.timestamp
      });

      return true;
    });
  } catch (error) {
    return { error };
  }
};

/**
 * Create or update user chatRoom
 * @param {*} chatRoomId ChatRoom ID
 * @param {*} chatRoom ChatRoom data
 * @returns True
 */
exports.create = async (chatRoomId, chatRoom) => {
  try {
    const firestore = getFirestore();

    const clientChatRoomRef = firestore
      .collection('users')
      .doc(chatRoom.users[0].id)
      .collection('chatRooms')
      .doc(chatRoomId);

    await firestore.runTransaction(async (transaction) => {
      const clientChatRoom = (await transaction.get(clientChatRoomRef)).data();

      if (!clientChatRoom) {
        sendMessage(chatRoomId, {
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        createPending(chatRoomId, chatRoom);

        transaction.set(clientChatRoomRef, {
          ...chatRoom,
          counter: 1,
          duration: 0
        });

        return true;
      }

      const currentTimestamp = Date.now();
      if (clientChatRoom.expiredAt === 0) {
        sendMessage(chatRoomId, {
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        createPending(chatRoomId, chatRoom);

        const counter = clientChatRoom.counter + 1;
        transaction.update(clientChatRoomRef, {
          ...chatRoom,
          counter,
          duration: 0,
          expiredAt: 0
        });

        return true;
      }

      if (clientChatRoom.expiredAt < currentTimestamp) {
        sendMessage(chatRoomId, {
          text: chatRoom.latestMessage.text,
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        });

        createPending(chatRoomId, chatRoom);

        const counter = clientChatRoom.counter + 1;
        transaction.update(clientChatRoomRef, {
          ...chatRoom,
          counter,
          duration: 0,
          expiredAt: 0
        });

        return true;
      }

      sendMessage(chatRoomId, {
        text: 'Durasi konsultasi telah diperpanjang',
        sender: chatRoom.latestMessage.sender,
        timestamp: chatRoom.latestMessage.timestamp
      });

      const adminChatRoomRef = firestore
        .collection('users')
        .doc(clientChatRoom.users[1].id)
        .collection('chatRooms')
        .doc(chatRoomId);

      const adminChatRoom = (await transaction.get(adminChatRoomRef)).data();

      const adminCounter = adminChatRoom.counter + 1;
      const adminDuration = adminChatRoom.duration + chatRoom.duration;
      const adminExpiredAt =
        adminChatRoom.expiredAt + chatRoom.duration * 60 * 60 * 1000;

      transaction.update(adminChatRoomRef, {
        name: chatRoom.name,
        image: chatRoom.image,
        latestMessage: {
          text: 'Durasi konsultasi telah diperpanjang',
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        },
        counter: adminCounter,
        duration: adminDuration,
        expiredAt: adminExpiredAt
      });

      const userCounter = clientChatRoom.counter + 1;
      const userDuration = clientChatRoom.duration + chatRoom.duration;
      const userExpiredAt =
        clientChatRoom.expiredAt + chatRoom.duration * 60 * 60 * 1000;

      transaction.update(clientChatRoomRef, {
        name: chatRoom.name,
        image: chatRoom.image,
        latestMessage: {
          text: 'Durasi konsultasi telah diperpanjang',
          sender: chatRoom.latestMessage.sender,
          timestamp: chatRoom.latestMessage.timestamp
        },
        counter: userCounter,
        duration: userDuration,
        expiredAt: userExpiredAt
      });

      return true;
    });
  } catch (error) {
    return { error };
  }
};

/**
 * Accept pending chatroom (orders)
 * @param {*} pendingChatRoom PendingChatRoom data
 * @returns True
 */
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

    const pendingChatRoomRef = firestore
      .collection('pendingChatRooms')
      .doc(pendingChatRoom.id);

    pendingChatRoomRef.delete();

    await firestore.runTransaction(async (transaction) => {
      const clientChatRoom = (await transaction.get(clientChatRoomRef)).data();
      if (!clientChatRoom) return false;

      const userCounter = clientChatRoom.counter;

      sendMessage(pendingChatRoom.id, {
        text: 'Sesi konsultasi sudah dimulai',
        sender: 'System',
        timestamp: currentTimestamp
      });

      transaction.set(adminChatRoomRef, {
        ...clientChatRoom,
        latestMessage: {
          text: 'Sesi konsultasi sudah dimulai',
          sender: 'System',
          timestamp: currentTimestamp
        },
        users: [admin, client],
        counter: 1,
        duration,
        expiredAt: currentTimestamp + durationTimestamp
      });
      transaction.set(clientChatRoomRef, {
        ...clientChatRoom,
        latestMessage: {
          text: 'Sesi konsultasi sudah dimulai',
          sender: 'System',
          timestamp: currentTimestamp
        },
        users: [client, admin],
        counter: userCounter + 1,
        duration,
        expiredAt: currentTimestamp + durationTimestamp
      });

      return true;
    });
  } catch (error) {
    return { error };
  }
};
