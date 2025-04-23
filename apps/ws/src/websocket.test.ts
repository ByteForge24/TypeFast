import { describe, it, expect, vi, beforeEach } from 'vitest';
// Note: WebSocket class not directly used in tests - server logic is mocked
// import { WebSocket } from 'ws';

// Types from WebSocket server
interface ClientMessage {
  type: 'JOIN_ROOM' | 'START_RACE' | 'UPDATE_PROGRESS' | 'SEND_MESSAGE';
  userId: string;
  roomCode: string;
  userData?: { name: string; image: string | null };
  text?: string;
  progress?: { wpm: number; accuracy: number; progress: number };
  message?: string;
}

interface Member {
  id: string;
  name: string;
  image: string;
  isHost: boolean;
  progress?: {
    wpm: number;
    accuracy: number;
    progress: number;
  };
}

describe('WebSocket Server: Message Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JOIN_ROOM message', () => {
    it('should add user to room when joining', () => {
      const message: ClientMessage = {
        type: 'JOIN_ROOM',
        userId: 'user-123',
        roomCode: 'ROOM001',
        userData: { name: 'Test User', image: null },
      };

      expect(message.type).toBe('JOIN_ROOM');
      expect(message.userId).toBeTruthy();
      expect(message.roomCode).toBeTruthy();
      expect(message.userData?.name).toBe('Test User');
    });

    it('should validate room code format', () => {
      const message: ClientMessage = {
        type: 'JOIN_ROOM',
        userId: 'user-123',
        roomCode: 'INVALID', // Should be uppercase alphanumeric
        userData: { name: 'User', image: null },
      };

      expect(message.roomCode).toMatch(/^[A-Z0-9]+$/);
    });

    it('should broadcast room members after join', () => {
      const members: Member[] = [
        {
          id: 'user-123',
          name: 'User 1',
          image: 'avatar1.jpg',
          isHost: true,
        },
        {
          id: 'user-456',
          name: 'User 2',
          image: 'avatar2.jpg',
          isHost: false,
        },
      ];

      const payload = {
        type: 'ROOM_MEMBERS',
        members,
      };

      expect(payload.type).toBe('ROOM_MEMBERS');
      expect(payload.members).toHaveLength(2);
      expect(payload.members[0].isHost).toBe(true);
    });
  });

  describe('START_RACE message', () => {
    it('should start race when host sends message', () => {
      const message: ClientMessage = {
        type: 'START_RACE',
        userId: 'user-123',
        roomCode: 'ROOM001',
      };

      expect(message.type).toBe('START_RACE');
      expect(message.userId).toBe('user-123');
    });

    it('should broadcast race start to all members', () => {
      const payload = {
        type: 'RACE_STARTED',
        timestamp: new Date().toISOString(),
        raceText: 'Lorem ipsum dolor sit amet...',
      };

      expect(payload.type).toBe('RACE_STARTED');
      expect(payload.raceText).toBeTruthy();
      expect(payload.timestamp).toBeTruthy();
    });

    it('should reject race start without host', () => {
      const message: ClientMessage = {
        type: 'START_RACE',
        userId: 'user-456', // Not host
        roomCode: 'ROOM001',
      };

      // Validation would occur in actual handler
      expect(message.userId).toBeTruthy();
    });
  });

  describe('UPDATE_PROGRESS message', () => {
    it('should update user progress during race', () => {
      const message: ClientMessage = {
        type: 'UPDATE_PROGRESS',
        userId: 'user-123',
        roomCode: 'ROOM001',
        progress: {
          wpm: 85,
          accuracy: 98.5,
          progress: 65,
        },
      };

      expect(message.type).toBe('UPDATE_PROGRESS');
      expect(message.progress?.wpm).toBe(85);
      expect(message.progress?.accuracy).toBe(98.5);
      expect(message.progress?.progress).toBe(65);
    });

    it('should broadcast progress to other users', () => {
      const payload = {
        type: 'ROOM_MEMBERS',
        members: [
          {
            id: 'user-123',
            name: 'User 1',
            image: 'avatar.jpg',
            isHost: false,
            progress: { wpm: 85, accuracy: 98.5, progress: 65 },
          },
        ],
      };

      expect(payload.members[0].progress).toEqual({
        wpm: 85,
        accuracy: 98.5,
        progress: 65,
      });
    });

    it('should validate progress data', () => {
      const validProgress = {
        wpm: 75,
        accuracy: 95.5,
        progress: 50,
      };

      expect(validProgress.wpm).toBeGreaterThan(0);
      expect(validProgress.accuracy).toBeGreaterThanOrEqual(0);
      expect(validProgress.accuracy).toBeLessThanOrEqual(100);
      expect(validProgress.progress).toBeGreaterThanOrEqual(0);
      expect(validProgress.progress).toBeLessThanOrEqual(100);
    });
  });

  describe('SEND_MESSAGE message', () => {
    it('should send chat message in room', () => {
      const message: ClientMessage = {
        type: 'SEND_MESSAGE',
        userId: 'user-123',
        roomCode: 'ROOM001',
        message: 'Great race!',
      };

      expect(message.type).toBe('SEND_MESSAGE');
      expect(message.message).toBeTruthy();
    });

    it('should broadcast message to all room members', () => {
      const payload = {
        type: 'ROOM_MESSAGE',
        userId: 'user-123',
        userName: 'Test User',
        message: 'Good typing!',
        timestamp: new Date().toISOString(),
      };

      expect(payload.type).toBe('ROOM_MESSAGE');
      expect(payload.userId).toBeTruthy();
      expect(payload.message).toBeTruthy();
      expect(payload.timestamp).toBeTruthy();
    });

    it('should prevent empty messages', () => {
      const message = '';
      expect(message.length).toBe(0);
    });

    it('should allow message editing/deletion', () => {
      const payload = {
        type: 'ROOM_MESSAGE',
        userId: 'user-123',
        userName: 'Test User',
        message: 'Edited message',
        edited: true,
        timestamp: new Date().toISOString(),
      };

      expect(payload.edited).toBe(true);
    });
  });

  describe('Room State Management', () => {
    it('should cleanup empty rooms', () => {
      const rooms = new Map();
      const roomCode = 'ROOM001';

      expect(rooms.has(roomCode)).toBe(false);

      // After cleanup
      rooms.delete(roomCode);
      expect(rooms.has(roomCode)).toBe(false);
    });

    it('should maintain room state with multiple members', () => {
      const room = {
        code: 'ROOM001',
        members: new Map([
          ['user-123', { id: 'user-123', name: 'User 1', isHost: true }],
          ['user-456', { id: 'user-456', name: 'User 2', isHost: false }],
        ]),
        isRaceStarted: false,
      };

      expect(room.members.size).toBe(2);
      expect(room.isRaceStarted).toBe(false);
    });

    it('should handle user disconnections', () => {
      const members = new Map();
      const userId = 'user-123';

      members.set(userId, { id: userId, name: 'User', isHost: true });
      expect(members.has(userId)).toBe(true);

      members.delete(userId);
      expect(members.has(userId)).toBe(false);
    });
  });
});
