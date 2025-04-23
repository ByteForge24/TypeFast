# WebSocket Server Fixes - Before & After Code

## Fix #1: TypeScript Configuration

### Before (`apps/ws/tsconfig.json`)
```json
{
  "extends": "../../packages/typescript-config/base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./dist",
```

**Problem**: Path `../../packages/typescript-config/base.json` doesn't exist

### After
```json
{
  "extends": "../web/typescript-config/base.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "moduleResolution": "node",
    "outDir": "./dist",
```

**Changes**:
- Line 2: `../../packages/` → `../web/` (correct path)
- Line 8: Added `"moduleResolution": "node"` (enable Node.js module lookup)

---

## Fix #2: Import RawData Type

### Before (`apps/ws/src/index.ts`, line 1)
```typescript
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
```

### After
```typescript
import { WebSocketServer, WebSocket, RawData } from "ws";
import { createServer } from "http";
```

**Change**: Added `RawData` to imports from "ws" package

---

## Fix #3: Define RoomMember Interface

### Before (`apps/ws/src/index.ts`, lines 25-31)
```typescript
interface Room {
  code: string;
  members: Map<string, { ws: WebSocket; user: UserData; isHost: boolean }>;
  raceText?: string;
  isRaceStarted?: boolean;
}
```

**Problem**: 
- Inline member type has no progress field
- `broadcastRoomMembers()` tries to read `m.progress`
- `handleUpdateProgress()` tries to write `member.progress`

### After
```typescript
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
```

**Changes**:
- Lines 29-37: New `RoomMember` interface with optional `progress` field
- Line 41: `members` now uses `Map<string, RoomMember>` instead of inline type

---

## Fix #4: Fix WebSocket Message Handler

### Before (`apps/ws/src/index.ts`, lines 258-261)
```typescript
  ws.on("message", (rawData: string) => {
    try {
      const data: ClientMessage = JSON.parse(rawData);

      switch (data.type) {
```

**Problem**: 
- Type `string` is incorrect - WebSocket sends `RawData`
- `RawData` is `Buffer | ArrayBuffer | Buffer[]`
- Direct `JSON.parse(rawData)` would fail if rawData is Buffer

### After
```typescript
  ws.on("message", (rawData: RawData) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());

      switch (data.type) {
```

**Changes**:
- Line 260: `(rawData: string)` → `(rawData: RawData)`
- Line 262: `JSON.parse(rawData)` → `JSON.parse(rawData.toString())`

---

## Impact on Code Using These Types

### broadcastRoomMembers() - Now Works Correctly

```typescript
// BEFORE: Type error - m doesn't have progress
function broadcastRoomMembers(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const members: Member[] = Array.from(room.members.values()).map((m) => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image || "",
    isHost: m.isHost,
    progress: m.progress,  // ❌ Type error: m is { ws, user, isHost }
  }));
```

```typescript
// AFTER: ✅ Works - RoomMember has progress field
function broadcastRoomMembers(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const members: Member[] = Array.from(room.members.values()).map((m) => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image || "",
    isHost: m.isHost,
    progress: m.progress,  // ✅ Type safe: m is RoomMember
  }));
```

### handleUpdateProgress() - Now Type Safe

```typescript
// BEFORE: Type error - member type lacks progress
function handleUpdateProgress(ws: WebSocket, data: ClientMessage) {
  const { userId, roomCode, progress } = data;
  
  const member = room.members.get(userId);
  if (!member) return;

  member.progress = progress;  // ❌ Type error: no progress property
```

```typescript
// AFTER: ✅ Type safe - RoomMember has progress field
function handleUpdateProgress(ws: WebSocket, data: ClientMessage) {
  const { userId, roomCode, progress } = data;
  
  const member = room.members.get(userId);
  if (!member) return;

  member.progress = progress;  // ✅ Type safe: RoomMember has progress
```

---

## Summary of Changes

| Item | Before | After | Reason |
|------|--------|-------|--------|
| tsconfig extends | `../../packages/...` | `../web/...` | Correct path in actual repo |
| RoomMember type | Inline, no progress | Interface with progress | Support runtime updates |
| Message handler | `string` type | `RawData` type | Correct WebSocket event type |
| String conversion | Direct parse | `.toString()` | Handle Buffer properly |
| moduleResolution | (inherited) | `"node"` | Enable Node.js globals |

---

## Verification Commands

```bash
# Check for type errors
cd apps/ws && yarn type-check

# Build to verify compilation
yarn ws:build

# Check dist/ was created
ls -la dist/

# Verify message contracts in runtime
yarn ws:dev
# (server will start and accept connections)
```

---

## Message Contracts: Zero Changes

All message types and payloads remain exactly as client expects:

✅ JOIN_ROOM - structure unchanged
✅ START_RACE - structure unchanged  
✅ UPDATE_PROGRESS - structure unchanged (progress field now properly typed)
✅ SEND_MESSAGE - structure unchanged
✅ ROOM_MEMBERS - structure unchanged
✅ RACE_START - structure unchanged
✅ PROGRESS_UPDATE - structure unchanged
✅ MESSAGE - structure unchanged

All UI components continue to work without modification.
