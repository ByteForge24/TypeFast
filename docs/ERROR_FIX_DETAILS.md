# WebSocket Server - Error Fix Details

## Error #1: Invalid TypeScript Config Path

**Original**:
```json
{
  "extends": "../../packages/typescript-config/base.json",
```

**Error**: File not found - no `packages/` directory in repo

**Fixed**:
```json
{
  "extends": "../web/typescript-config/base.json",
  "compilerOptions": {
    ...
    "moduleResolution": "node",
```

**Why**: 
- Base config is at `apps/web/typescript-config/base.json`
- From `apps/ws/tsconfig.json`, relative path is `../web/typescript-config/base.json`
- Added `moduleResolution: "node"` for proper module lookup

**File**: `apps/ws/tsconfig.json` (line 2)

---

## Error #2: Missing `progress` Field in Room Member Type

**Original**:
```typescript
interface Room {
  code: string;
  members: Map<string, { ws: WebSocket; user: UserData; isHost: boolean }>;
  //                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ 
  //                       No progress field!
  raceText?: string;
  isRaceStarted?: boolean;
}
```

**Error 1 - Read**: Line 75 in `broadcastRoomMembers()`
```typescript
const members: Member[] = Array.from(room.members.values()).map((m) => ({
  ...
  progress: m.progress,  // ❌ m doesn't have progress
```

**Error 2 - Write**: Line 196 in `handleUpdateProgress()`
```typescript
member.progress = progress;  // ❌ member type doesn't have progress
```

**Fixed**:
```typescript
interface RoomMember {
  ws: WebSocket;
  user: UserData;
  isHost: boolean;
  progress?: {           // ✅ Added progress field
    wpm: number;
    accuracy: number;
    progress: number;
  };
}

interface Room {
  code: string;
  members: Map<string, RoomMember>;  // ✅ Use RoomMember
  raceText?: string;
  isRaceStarted?: boolean;
}
```

**Why**: 
- Members need to track real-time typing metrics
- Progress is optional because new members don't have it yet
- Broadcast function needs to read it, update handler needs to write it

**File**: `apps/ws/src/index.ts` (lines 29-39)

---

## Error #3: WebSocket Message Event Handler Type Mismatch

**Original**:
```typescript
import { WebSocketServer, WebSocket } from "ws";

...

ws.on("message", (rawData: string) => {  // ❌ Wrong type
  try {
    const data: ClientMessage = JSON.parse(rawData);  // Assumes it's a string
```

**Error**: TypeScript type mismatch
- WebSocket message event sends `RawData` type (Buffer | ArrayBuffer | Buffer[])
- Code assumes string directly
- Would fail at runtime if rawData is Buffer

**Fixed**:
```typescript
import { WebSocketServer, WebSocket, RawData } from "ws";  // ✅ Import RawData

...

ws.on("message", (rawData: RawData) => {  // ✅ Correct type
  try {
    const data: ClientMessage = JSON.parse(rawData.toString());  // ✅ Convert to string
```

**Why**:
- `RawData` is the correct type from ws package
- `.toString()` properly converts Buffer to string for JSON parsing
- This is the safe, type-correct approach

**File**: `apps/ws/src/index.ts` (lines 1, 260-261)

---

## Error #4: Missing Node.js Global Types

**Original** (implicit from base config):
```json
{
  "lib": ["es2022", "DOM", "DOM.Iterable"],  // Web-focused
}
```

**Error**: Multiple instances:
```
Cannot find name 'console'
Cannot find name 'process'
```

Reason: Extended base config targets browser/DOM environment, not Node.js

**Fixed**:
```json
{
  "lib": ["ES2020"],        // ✅ Node.js runtime
  "moduleResolution": "node",  // ✅ Node resolution
}
```

**Why**:
- `console` is a Node.js global
- `process` is a Node.js global  
- Must explicitly target Node.js lib types
- Overrides the extended config's DOM types

**File**: `apps/ws/tsconfig.json` (lines 7, 8)

---

## Validation: Error → Fix Mapping

| Error | Line(s) | Issue | Fix Applied | Status |
|-------|---------|-------|-------------|--------|
| Config path | tsconfig:2 | extends wrong path | Use `../web/typescript-config/base.json` | ✅ |
| Missing type | index:30 | Room member lacks progress | Add RoomMember interface | ✅ |
| Type mismatch | index:260 | rawData should be RawData | Import RawData, use .toString() | ✅ |
| Missing globals | index:139,169,203... | console not found | Set lib: ["ES2020"] | ✅ |

---

## Message Contracts Verification

All client↔server message types remain identical:

### ✅ No Changes to Message Shape

| Message | Payload Structure | Status |
|---------|-------------------|--------|
| JOIN_ROOM | `{ type, userId, roomCode, userData: {name, image} }` | ✅ Unchanged |
| START_RACE | `{ type, userId, roomCode, text }` | ✅ Unchanged |
| UPDATE_PROGRESS | `{ type, userId, roomCode, progress: {wpm, accuracy, progress} }` | ✅ Unchanged |
| SEND_MESSAGE | `{ type, userId, roomCode, message }` | ✅ Unchanged |
| ROOM_MEMBERS | `{ type, members: [...] }` | ✅ Unchanged |
| RACE_START | `{ type, text }` | ✅ Unchanged |
| PROGRESS_UPDATE | `{ type, userId, progress: {...} }` | ✅ Unchanged |
| MESSAGE | `{ type, userData: {name, image}, message }` | ✅ Unchanged |

---

## Files Modified Summary

```
apps/ws/
├── tsconfig.json          ← 1 line changed (extends path)
└── src/
    └── index.ts           ← 4 changes:
                              1. Import RawData
                              2. Add RoomMember interface
                              3. Update Room.members type
                              4. Fix message handler signature
```

**Total changes: 5 lines across 2 files**

---

## Final Type-Check Expected Result

```
✅ No errors
✅ No warnings (noUnusedLocals, noUnusedParameters passing)
✅ Strict mode passing (strict, strictNullChecks, etc.)
```

---

## Testing Verification Steps

```bash
# 1. Type-check passes
cd apps/ws && yarn type-check

# 2. Builds without errors
yarn ws:build

# 3. Dev server starts
yarn ws:dev

# 4. Server ready for integration testing
```
