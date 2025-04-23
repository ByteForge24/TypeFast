# Phase 1.1.2 Implementation - WebSocket Server Deployment

## Overview
Made the real-time deployment entry explicit for the WebSocket server in `apps/ws`. The server is now properly configured for both local and production deployments.

## Files Changed

### 1. `render.yaml` - Production Deployment Config
Added a new WebSocket service (`typefast-ws`) alongside the existing web service:

**Key additions:**
- Service name: `typefast-ws`
- Runtime: Node
- Build command: `yarn ws:build`
- Start command: `node apps/ws/dist/index.js`
- Build filter: Only rebuilds on changes to `apps/ws/**`
- Environment variables:
  - `WS_PORT=8080`
  - `WS_HOST=0.0.0.0`

**Web service update:**
- Added `NEXT_PUBLIC_WS_URL=https://typefast-ws.onrender.com` environment variable
- This ensures the frontend knows where to connect to the WebSocket in production

### 2. `docker-compose.yml` - Local Development
Added WebSocket service to docker-compose for local development:

```yaml
ws:
  build:
    context: .
    dockerfile: docker/Dockerfile.ws
  container_name: typefast-ws
  ports:
    - "8080:8080"
  environment:
    - WS_PORT=8080
    - WS_HOST=0.0.0.0
```

The web service is updated to:
- Depend on the `ws` service
- Set `NEXT_PUBLIC_WS_URL=ws://localhost:8080` for local development

### 3. `docker/Dockerfile.ws` - Already Configured
The Dockerfile for the WebSocket server was already properly set up:
- Multi-stage build (builder → installer → runner)
- Exposes port 8080
- Runs `yarn workspace ws start` (executes `node dist/index.js`)
- No changes needed

### 4. `apps/ws/package.json` - Already Configured
Scripts already present and used:
- `build`: `tsc` (compiles TypeScript)
- `start`: `node dist/index.js` (runs production server)
- No changes needed

## Production Deployment Path

### Build Phase
```bash
yarn ws:build
# Runs: tsc (from apps/ws)
# Output: apps/ws/dist/index.js
```

### Runtime Phase
```bash
node apps/ws/dist/index.js
```

**Environment Variables:**
- `WS_PORT` (default: 8080) - Port to listen on
- `WS_HOST` (default: 0.0.0.0) - Host to bind to

## Local Development

### Using Docker Compose
```bash
docker-compose up
```

Services running:
- **web**: http://localhost:3000 → Uses `NEXT_PUBLIC_WS_URL=ws://localhost:8080`
- **ws**: ws://localhost:8080 → WebSocket server
- **db**: mysql://localhost:3306 → Database

### Without Docker
```bash
# Terminal 1: Start web app
yarn dev

# Terminal 2: Start WebSocket server
yarn ws:dev
```

Set environment variable:
```bash
# Create apps/web/.env.local
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Production Deployment on Render

1. **Create new Render service (if not auto-detected):**
   - Name: `typefast-ws`
   - Runtime: Node
   - Build command: `yarn ws:build`
   - Start command: `node apps/ws/dist/index.js`
   - Port: 8080

2. **Set environment variables:**
   - `NODE_ENV=production`
   - `WS_PORT=8080`
   - `WS_HOST=0.0.0.0`

3. **Update web service's `NEXT_PUBLIC_WS_URL`:**
   - Set to: `https://typefast-ws.onrender.com`
   - This tells the frontend where to connect to the WebSocket

4. **Deploy:**
   - Push changes to the connected Git branch
   - Render will auto-detect and deploy both services

## Environment Variables Summary

### WebSocket Server
| Variable | Default | Purpose |
|----------|---------|---------|
| `WS_PORT` | 8080 | Port the WebSocket server listens on |
| `WS_HOST` | 0.0.0.0 | Host to bind to (all interfaces) |
| `NODE_ENV` | development | Runtime environment |

### Web App (Frontend)
| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_WS_URL` | https://ws.TypeFast.club | WebSocket server endpoint |

**Fallback:** If `NEXT_PUBLIC_WS_URL` is not set, web app defaults to "https://ws.TypeFast.club"

## Execution Path

```
Production (Render):
├─ typefast-web service
│  ├─ Build: yarn build (Next.js)
│  ├─ Start: yarn start (Next.js server on :3000)
│  └─ Uses: NEXT_PUBLIC_WS_URL=https://typefast-ws.onrender.com
│
└─ typefast-ws service
   ├─ Build: yarn ws:build (tsc compile)
   ├─ Start: node apps/ws/dist/index.js
   ├─ Port: 8080
   └─ Receives: WS_PORT, WS_HOST env vars
```

## Message Contracts - Unchanged

All existing message types preserved exactly:
- ✅ Client → Server: `JOIN_ROOM`, `START_RACE`, `UPDATE_PROGRESS`, `SEND_MESSAGE`
- ✅ Server → Client: `ROOM_MEMBERS`, `RACE_START`, `PROGRESS_UPDATE`, `MESSAGE`

## UI/Frontend - Unchanged

- ✅ Zero changes to `apps/web` UI components
- ✅ Zero styling or layout changes
- ✅ Frontend behavior unchanged
- ✅ Only the `NEXT_PUBLIC_WS_URL` environment variable is used to point to the server

## Validation

### Local Testing
```bash
# Start Docker Compose
docker-compose up

# Verify services are up
curl http://localhost:3000     # Web app
curl http://localhost:8080     # WebSocket (should respond to upgrade)
```

### Production Testing on Render
1. Visit web app: https://typefast.onrender.com
2. Frontend connects to: https://typefast-ws.onrender.com
3. Try multiplayer features (join room, start race, progress updates, chat)

## Summary

Phase 1.1.2 Complete: WebSocket deployment is now explicit and configurable.

- ✅ Two independent services defined in `render.yaml`
- ✅ Clear build command: `yarn ws:build` (runs tsc)
- ✅ Clear start command: `node apps/ws/dist/index.js`
- ✅ Environment variables configurable
- ✅ Local development via docker-compose
- ✅ Production deployment via Render
- ✅ Zero UI/frontend changes
- ✅ All message contracts preserved
