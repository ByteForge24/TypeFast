import { WebSocketServer, WebSocket, RawData } from "ws";
import { createServer } from "http";

const PORT = parseInt(process.env.PORT || "10000", 10);
const HOST = "0.0.0.0";

// Types for internal server state
interface UserData {
  id: string;
  name: string;
  image: string | null;
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

interface RoomMember {
  ws: WebSocket;
  user: UserData;
  isHost: boolean;
  progress?: {
    wpm: number;
    accuracy: number;
    progress: number;
  };
}

interface Room {
  code: string;
  members: Map<string, RoomMember>;
  raceText?: string;
  isRaceStarted?: boolean;
}

interface ClientMessage {
  type: "JOIN_ROOM" | "START_RACE" | "UPDATE_PROGRESS" | "SEND_MESSAGE";
  userId: string;
  roomCode: string;
  userData?: { name: string; image: string | null };
  text?: string;
  progress?: { wpm: number; accuracy: number; progress: number };
  message?: string;
}

// Global state: room code -> Room data
const rooms = new Map<string, Room>();

// Helper: Broadcast message to all members in a room
function broadcastToRoom(roomCode: string, message: string, exclude?: WebSocket) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.members.forEach((member) => {
    if (exclude && member.ws === exclude) return;
    if (member.ws.readyState === WebSocket.OPEN) {
      member.ws.send(message);
    }
  });
}

// Helper: Broadcast ROOM_MEMBERS to all in room
function broadcastRoomMembers(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const members: Member[] = Array.from(room.members.values()).map((m) => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image || "",
    isHost: m.isHost,
    progress: m.progress,
  }));

  const payload = JSON.stringify({
    type: "ROOM_MEMBERS",
    members,
  });

  broadcastToRoom(roomCode, payload);
}

// Helper: Clean up empty rooms
function cleanupRoom(roomCode: string) {
  const room = rooms.get(roomCode);
  if (room && room.members.size === 0) {
    rooms.delete(roomCode);
  }
}

// Message handlers
function handleJoinRoom(
  ws: WebSocket,
  data: ClientMessage
) {
  const { userId, roomCode, userData } = data;

  if (!userId || !roomCode || !userData) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JOIN_ROOM payload" }));
    return;
  }

  // Create room if it doesn't exist
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      code: roomCode,
      members: new Map(),
    });
  }

  const room = rooms.get(roomCode)!;

  // Check if this is the first member (they become host)
  const isHost = room.members.size === 0;

  // Add or update member
  room.members.set(userId, {
    ws,
    user: {
      id: userId,
      name: userData.name,
      image: userData.image || null,
    },
    isHost,
  });

  // Keep reference to room for cleanup on disconnect
  (ws as any).roomCode = roomCode;
  (ws as any).userId = userId;

  console.log(`User ${userId} joined room ${roomCode} (host: ${isHost})`);

  // Broadcast updated member list to all in room
  broadcastRoomMembers(roomCode);
}

function handleStartRace(ws: WebSocket, data: ClientMessage) {
  const { userId, roomCode, text } = data;

  if (!userId || !roomCode || !text) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid START_RACE payload" }));
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Room not found" }));
    return;
  }

  // Verify sender is in room
  if (!room.members.has(userId)) {
    ws.send(JSON.stringify({ type: "ERROR", message: "User not in room" }));
    return;
  }

  // Store race state
  room.raceText = text;
  room.isRaceStarted = true;

  console.log(`Race started in room ${roomCode} by user ${userId}`);

  // Broadcast RACE_START to all members
  const payload = JSON.stringify({
    type: "RACE_START",
    text,
  });

  broadcastToRoom(roomCode, payload);
}

function handleUpdateProgress(ws: WebSocket, data: ClientMessage) {
  const { userId, roomCode, progress } = data;

  if (!userId || !roomCode || !progress) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid UPDATE_PROGRESS payload" }));
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Room not found" }));
    return;
  }

  const member = room.members.get(userId);
  if (!member) {
    ws.send(JSON.stringify({ type: "ERROR", message: "User not in room" }));
    return;
  }

  // Update member's progress
  member.progress = progress;

  console.log(`Progress update in room ${roomCode} from user ${userId}: ${progress.progress}%`);

  // Broadcast PROGRESS_UPDATE to all members
  const payload = JSON.stringify({
    type: "PROGRESS_UPDATE",
    userId,
    progress,
  });

  broadcastToRoom(roomCode, payload);
}

function handleSendMessage(ws: WebSocket, data: ClientMessage) {
  const { userId, roomCode, message } = data;

  if (!userId || !roomCode || !message) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Invalid SEND_MESSAGE payload" }));
    return;
  }

  const room = rooms.get(roomCode);
  if (!room) {
    ws.send(JSON.stringify({ type: "ERROR", message: "Room not found" }));
    return;
  }

  const member = room.members.get(userId);
  if (!member) {
    ws.send(JSON.stringify({ type: "ERROR", message: "User not in room" }));
    return;
  }

  console.log(`Message in room ${roomCode} from user ${userId}: ${message}`);

  // Broadcast MESSAGE to all members
  const payload = JSON.stringify({
    type: "MESSAGE",
    userData: {
      name: member.user.name,
      image: member.user.image,
    },
    message,
  });

  broadcastToRoom(roomCode, payload);
}

// Create HTTP server for WebSocket
const server = createServer((req, res) => {
  // Handle health check and basic HTTP requests
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("New WebSocket connection");

  ws.on("message", (rawData: RawData) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());

      switch (data.type) {
        case "JOIN_ROOM":
          handleJoinRoom(ws, data);
          break;
        case "START_RACE":
          handleStartRace(ws, data);
          break;
        case "UPDATE_PROGRESS":
          handleUpdateProgress(ws, data);
          break;
        case "SEND_MESSAGE":
          handleSendMessage(ws, data);
          break;
        default:
          console.warn("Unknown message type:", (data as any).type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      ws.send(JSON.stringify({ type: "ERROR", message: "Invalid JSON" }));
    }
  });

  ws.on("close", () => {
    const roomCode = (ws as any).roomCode;
    const userId = (ws as any).userId;

    if (roomCode && userId) {
      const room = rooms.get(roomCode);
      if (room) {
        room.members.delete(userId);
        console.log(`User ${userId} left room ${roomCode}`);

        // Broadcast updated member list
        if (room.members.size > 0) {
          broadcastRoomMembers(roomCode);
        } else {
          // Clean up empty room
          cleanupRoom(roomCode);
        }
      }
    }

    console.log("WebSocket connection closed");
  });

  ws.on("error", (error: Error) => {
    console.error("WebSocket error:", error);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server running on ${HOST}:${PORT}`);
});