# WebSocket Server

Real-time WebSocket server for TypeFast multiplayer features.

## Message Types

### Client → Server

- **JOIN_ROOM**: Join a multiplayer room
  ```json
  {
    "type": "JOIN_ROOM",
    "userId": "user-id",
    "roomCode": "room-code",
    "userData": { "name": "John", "image": "url-or-null" }
  }
  ```

- **START_RACE**: Begin a typing race
  ```json
  {
    "type": "START_RACE",
    "userId": "user-id",
    "roomCode": "room-code",
    "text": "the text to type..."
  }
  ```

- **UPDATE_PROGRESS**: Send real-time typing progress
  ```json
  {
    "type": "UPDATE_PROGRESS",
    "userId": "user-id",
    "roomCode": "room-code",
    "progress": {
      "wpm": 120,
      "accuracy": 98.5,
      "progress": 50
    }
  }
  ```

- **SEND_MESSAGE**: Send a chat message
  ```json
  {
    "type": "SEND_MESSAGE",
    "userId": "user-id",
    "roomCode": "room-code",
    "message": "Hello!"
  }
  ```

### Server → Client (Broadcasts)

- **ROOM_MEMBERS**: Updated member list
  ```json
  {
    "type": "ROOM_MEMBERS",
    "members": [
      {
        "id": "user-id",
        "name": "John",
        "image": "url",
        "isHost": true,
        "progress": { "wpm": 120, "accuracy": 98.5, "progress": 50 }
      }
    ]
  }
  ```

- **RACE_START**: Race has started
  ```json
  {
    "type": "RACE_START",
    "text": "the text to type..."
  }
  ```

- **PROGRESS_UPDATE**: Member typing progress update
  ```json
  {
    "type": "PROGRESS_UPDATE",
    "userId": "user-id",
    "progress": {
      "wpm": 120,
      "accuracy": 98.5,
      "progress": 50
    }
  }
  ```

- **MESSAGE**: Chat message from a member
  ```json
  {
    "type": "MESSAGE",
    "userData": {
      "name": "John",
      "image": "url-or-null"
    },
    "message": "Hello!"
  }
  ```

## Development

Run the server in development mode:

```bash
yarn ws:dev
```

The server will start on `ws://localhost:8080` by default.

### Environment Variables

- `WS_PORT`: Port to listen on (default: 8080)
- `WS_HOST`: Host to bind to (default: 0.0.0.0)

## Production

Build and run:

```bash
yarn ws:build
yarn ws:start
```

Or use the separate npm scripts in the apps/ws folder:

```bash
yarn build
yarn start
```
