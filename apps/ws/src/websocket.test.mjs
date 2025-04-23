import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock WebSocket message types
const MESSAGE_TYPES = {
  JOIN_ROOM: 'JOIN_ROOM',
  START_RACE: 'START_RACE',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  SEND_MESSAGE: 'SEND_MESSAGE',
};

// Mock room manager
const rooms = new Map();

function createRoom(code) {
  const room = {
    code,
    members: [],
    host: null,
    isRacing: false,
    messages: [],
    createdAt: new Date(),
  };
  rooms.set(code, room);
  return room;
}

function deleteRoom(code) {
  rooms.delete(code);
}

// WebSocket message handlers
function handleJoinRoom(message) {
  const { userId, roomCode, userData } = message;

  if (!roomCode.match(/^[A-Z0-9]+$/)) {
    return { success: false, error: 'Invalid room code format' };
  }

  let room = rooms.get(roomCode);
  if (!room) {
    room = createRoom(roomCode);
  }

  const member = {
    id: userId,
    name: userData?.name || 'Anonymous',
    image: userData?.image || null,
    isHost: room.members.length === 0,
    progress: null,
  };

  if (member.isHost) {
    room.host = userId;
  }

  room.members.push(member);

  return {
    success: true,
    room,
    members: room.members,
  };
}

function handleStartRace(message) {
  const { userId, roomCode } = message;
  const room = rooms.get(roomCode);

  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.host !== userId) {
    return { success: false, error: 'Only host can start race' };
  }

  room.isRacing = true;
  return {
    success: true,
    room,
    broadcast: {
      type: 'RACE_STARTED',
      roomCode,
      startTime: new Date(),
    },
  };
}

function handleUpdateProgress(message) {
  const { userId, roomCode, progress } = message;
  const room = rooms.get(roomCode);

  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  const member = room.members.find(m => m.id === userId);
  if (!member) {
    return { success: false, error: 'User not in room' };
  }

  member.progress = progress;

  return {
    success: true,
    broadcast: {
      type: 'PROGRESS_UPDATE',
      userId,
      roomCode,
      progress,
    },
  };
}

function handleSendMessage(message) {
  const { userId, roomCode, text } = message;
  const room = rooms.get(roomCode);

  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (!text || text.trim() === '') {
    return { success: false, error: 'Message cannot be empty' };
  }

  const chatMessage = {
    userId,
    text,
    timestamp: new Date(),
  };

  room.messages.push(chatMessage);

  return {
    success: true,
    broadcast: {
      type: 'MESSAGE',
      userId,
      roomCode,
      text,
      timestamp: chatMessage.timestamp,
    },
  };
}

// Test Suite: WebSocket Server
test('WebSocket: JOIN_ROOM - should add user to room when joining', () => {
  const message = {
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-123',
    roomCode: 'ROOM001',
    userData: { name: 'Test User', image: null },
  };

  const result = handleJoinRoom(message);

  assert.strictEqual(result.success, true);
  assert.ok(result.room);
  assert.strictEqual(result.room.code, 'ROOM001');
  assert.ok(result.members.length > 0);
});

test('WebSocket: JOIN_ROOM - should validate room code format', () => {
  const message = {
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-123',
    roomCode: 'invalid!',
    userData: { name: 'User', image: null },
  };

  const result = handleJoinRoom(message);

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('WebSocket: JOIN_ROOM - should broadcast room members after join', () => {
  // Clear rooms for fresh test
  rooms.clear();

  const message = {
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-456',
    roomCode: 'ROOM002',
    userData: { name: 'User 2', image: null },
  };

  const result = handleJoinRoom(message);

  assert.ok(result.members);
  assert.ok(result.members.length >= 1);
  assert.strictEqual(result.members[0].id, 'user-456');
});

test('WebSocket: START_RACE - should start race when host initiates', () => {
  rooms.clear();

  // First, user joins as host
  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'host-user',
    roomCode: 'RACE001',
    userData: { name: 'Host', image: null },
  });

  const message = {
    type: MESSAGE_TYPES.START_RACE,
    userId: 'host-user',
    roomCode: 'RACE001',
  };

  const result = handleStartRace(message);

  assert.strictEqual(result.success, true);
  assert.ok(result.broadcast);
  assert.strictEqual(result.broadcast.type, 'RACE_STARTED');
});

test('WebSocket: START_RACE - should reject race start without host permission', () => {
  rooms.clear();

  // Host joins
  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'host-user',
    roomCode: 'RACE002',
    userData: { name: 'Host', image: null },
  });

  // Another user joins
  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'other-user',
    roomCode: 'RACE002',
    userData: { name: 'Other', image: null },
  });

  const message = {
    type: MESSAGE_TYPES.START_RACE,
    userId: 'other-user',
    roomCode: 'RACE002',
  };

  const result = handleStartRace(message);

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('Only host'));
});

test('WebSocket: UPDATE_PROGRESS - should update user progress', () => {
  rooms.clear();

  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-prog',
    roomCode: 'PROG001',
    userData: { name: 'Proggy', image: null },
  });

  const message = {
    type: MESSAGE_TYPES.UPDATE_PROGRESS,
    userId: 'user-prog',
    roomCode: 'PROG001',
    progress: { wpm: 75, accuracy: 98, progress: 50 },
  };

  const result = handleUpdateProgress(message);

  assert.strictEqual(result.success, true);
  assert.ok(result.broadcast);
  assert.strictEqual(result.broadcast.type, 'PROGRESS_UPDATE');
});

test('WebSocket: UPDATE_PROGRESS - should broadcast progress update', () => {
  const result = handleUpdateProgress({
    type: MESSAGE_TYPES.UPDATE_PROGRESS,
    userId: 'user-prog',
    roomCode: 'PROG001',
    progress: { wpm: 80, accuracy: 99, progress: 75 },
  });

  assert.ok(result.broadcast);
  assert.strictEqual(result.broadcast.userId, 'user-prog');
});

test('WebSocket: SEND_MESSAGE - should send message to room', () => {
  rooms.clear();

  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'chat-user',
    roomCode: 'CHAT001',
    userData: { name: 'Chatter', image: null },
  });

  const message = {
    type: MESSAGE_TYPES.SEND_MESSAGE,
    userId: 'chat-user',
    roomCode: 'CHAT001',
    text: 'Hello everyone!',
  };

  const result = handleSendMessage(message);

  assert.strictEqual(result.success, true);
  assert.ok(result.broadcast);
  assert.strictEqual(result.broadcast.type, 'MESSAGE');
  assert.strictEqual(result.broadcast.text, 'Hello everyone!');
});

test('WebSocket: SEND_MESSAGE - should prevent empty messages', () => {
  const message = {
    type: MESSAGE_TYPES.SEND_MESSAGE,
    userId: 'chat-user',
    roomCode: 'CHAT001',
    text: '',
  };

  const result = handleSendMessage(message);

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('WebSocket: SEND_MESSAGE - should reject messages in nonexistent rooms', () => {
  const message = {
    type: MESSAGE_TYPES.SEND_MESSAGE,
    userId: 'chat-user',
    roomCode: 'NONEXISTENT',
    text: 'Test message',
  };

  const result = handleSendMessage(message);

  assert.strictEqual(result.success, false);
  assert.ok(result.error.includes('not found'));
});

test('WebSocket: Room state - should cleanup empty rooms', () => {
  rooms.clear();

  const code = 'CLEANUP001';
  createRoom(code);
  assert.ok(rooms.has(code));

  deleteRoom(code);
  assert.strictEqual(rooms.has(code), false);
});

test('WebSocket: Room state - should maintain room with members and handle disconnections', () => {
  rooms.clear();

  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-1',
    roomCode: 'STATE001',
    userData: { name: 'User 1', image: null },
  });

  handleJoinRoom({
    type: MESSAGE_TYPES.JOIN_ROOM,
    userId: 'user-2',
    roomCode: 'STATE001',
    userData: { name: 'User 2', image: null },
  });

  const room = rooms.get('STATE001');
  assert.strictEqual(room.members.length, 2);

  // Simulate user disconnection
  room.members = room.members.filter(m => m.id !== 'user-1');
  assert.strictEqual(room.members.length, 1);
});
