# TypeFast - Project Architecture & System Design

## Executive Summary

**TypeFast** is a real-time multiplayer typing speed test application built as a monorepo with a modern tech stack. It enables users to practice typing, participate in live multiplayer races, track performance metrics, and compete on leaderboards using real-time WebSocket communication.

---

## 1. Project Structure

### Monorepo Architecture
- **Type**: Turbo Monorepo (yarn workspaces)
- **Root**: `c:\Users\HP\TypeFast\TypeFast`
- **Workspace Configuration**: `turbo.json`, `package.json`

### Core Applications
```
apps/
├── web/           # Next.js Frontend + Backend APIs
└── ws/            # WebSocket Server (Multiplayer Engine)
```

### Supporting Directories
- `docker/` - Docker configuration files
- `docs/` - Project documentation
- `test-results/` - E2E test artifacts
- `playwright-report/` - Test reports

---

## 2. Technology Stack

### Frontend (apps/web)
| Category | Technologies |
|----------|---------------|
| **Framework** | Next.js 16.2.0 (React 19.0.0) |
| **Language** | TypeScript 5.5.4 |
| **Styling** | Tailwind CSS 3.4.17, PostCSS 8.4.49 |
| **UI Components** | Radix UI (avatar, dialog, dropdown, select, switch, tabs), Lucide Icons |
| **Forms** | React Hook Form 7.54.0 + Zod validation |
| **State Management** | Zustand 5.0.2 |
| **Animation** | Framer Motion 11.13.5 |
| **HTTP/WebSocket** | Native ws 8.18.3 |
| **Notifications** | Sonner 1.7.1 |
| **Charts/Analytics** | Recharts 2.14.1 |
| **Other** | React Spinners, Random Words library, UUID |

### Backend APIs (apps/web)
| Category | Technologies |
|----------|---------------|
| **Runtime** | Node.js (LTS 20+) |
| **Framework** | Next.js API Routes |
| **Auth** | NextAuth.js 5.0.0-beta.25 |
| **ORM** | Prisma 6.15.0 |
| **Database** | PostgreSQL 16 (production), SQLite (dev) |
| **Caching** | Redis 7, IORedis, Upstash Redis |
| **Password Hashing** | bcryptjs 3.0.3 |
| **Email** | Resend 4.0.1 |

### WebSocket Server (apps/ws)
| Category | Technologies |
|----------|---------------|
| **Type** | Real-time multiplayer engine |
| **Language** | TypeScript 5.5.4 |
| **Server** | ws library 8.14.2 (Node.js native WebSocket) |
| **Runtime** | Node.js 20+, HTTP Server |
| **Port** | 8080 (default) |

### Development & Testing
| Category | Technologies |
|----------|---------------|
| **Build Tool** | Turbo 2.3.3 (monorepo orchestration) |
| **Testing (Unit)** | Vitest 1.0.0 |
| **Testing (E2E)** | Playwright 1.58.2 (Chrome, Firefox) |
| **Mock Server** | Mock Service Worker (MSW) 2.0.0 |
| **Linting** | ESLint 8.57.0 |
| **Formatting** | Prettier 3.2.5 |
| **Package Manager** | Yarn 1.22.22 |

### Deployment
| Platform | Type |
|----------|------|
| **Primary** | Render (PaaS) |
| **Docker** | Docker Compose (local dev), Multi-stage builds |
| **Server Config** | render.yaml |

---

## 3. Core Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Browser                           │
│              Next.js Frontend (React 19)                     │
│         ┌──────────────────────────────────────┐            │
│         │  Pages & Components                  │            │
│         │ - /type (typing test)                │            │
│         │ - /multiplayer (races)               │            │
│         │ - /leaderboard                       │            │
│         │ - /profile                           │            │
│         │ - /auth (login/signup)               │            │
│         └──────────────────────────────────────┘            │
└────────────┬──────────────────────────┬─────────────────────┘
             │ REST APIs                │ WebSocket
             │ (HTTP)                   │ (ws://)
             ▼                          ▼
    ┌─────────────────────┐    ┌──────────────────┐
    │  Next.js Server     │    │  WebSocket       │
    │  (Port 3000)        │    │  Server          │
    │                     │    │  (Port 8080)     │
    │ API Routes:         │    │                  │
    │ - /api/auth/*       │    │ Real-time Manager│
    │ - /api/room/*       │    │ - Join Room      │
    │ - /api/stats        │    │ - Start Race     │
    │ - /api/leaderboard  │    │ - Track Progress │
    │                     │    │ - Broadcast      │
    │ Auth: NextAuth.js   │    │   Results        │
    │ (JWT + Sessions)    │    │                  │
    └──────────┬──────────┘    └────────┬─────────┘
               │                        │
               │ Prisma ORM             │
               │                        │
               ▼                        ▼
    ┌──────────────────────────────────────────┐
    │     PostgreSQL Database (Render)         │
    │                                          │
    │  Tables:                                 │
    │  - User (auth, profile)                  │
    │  - Account (OAuth)                       │
    │  - Test (typing stats)                   │
    │  - Room (multiplayer sessions)           │
    │  - VerificationToken                     │
    └──────────────────────────────────────────┘

    ┌──────────────────────────────────────────┐
    │     Redis (Render)                       │
    │     - Session cache                      │
    │     - Real-time data                     │
    └──────────────────────────────────────────┘
```

### Application Layers

#### 1. Presentation Layer
- **Next.js Pages**: Server-side rendered with App Router
- **React Components**: Organized by feature
- **Client-side State**: Zustand stores
- **Real-time UI Updates**: Auto-refresh multiplayer rooms (3s polling)

#### 2. API Layer (Next.js API Routes)
**Authentication Endpoints** (`/api/auth/*`)
- NextAuth.js endpoints for login, logout, callbacks
- Credentials provider (username/password)
- Google OAuth provider
- Session management

**Room Endpoints** (`/api/room`)
- `POST /api/room` - Create new multiplayer room
- `GET /api/room` - Fetch public rooms
- `GET /api/room/[code]` - Get specific room details

**Stats Endpoints** (`/api/stats`)
- `GET /api/stats` - Aggregate statistics (total users, tests completed)

**Leaderboard Endpoints** (`/api/leaderboard`)
- Rankings by performance metrics

#### 3. Business Logic Layer
- **Prisma ORM**: Database models and migrations
- **Schema Validation**: Zod schemas for input validation
- **Authentication**: NextAuth with Credentials + Google OAuth
- **Password Hashing**: bcryptjs for secure credential storage

#### 4. Real-time Layer (WebSocket Server)
- **WebSocket Server**: Node.js ws library on port 8080
- **Message Types**:
  - `JOIN_ROOM` - User enters multiplayer room
  - `START_RACE` - Host initializes typing race
  - `UPDATE_PROGRESS` - Live WPM/accuracy tracking
  - `SEND_MESSAGE` - Chat during races
  - `ROOM_MEMBERS` - Broadcast member list
  - `RACE_START` - Notify all participants
- **Room Management**: In-memory Map of active rooms and members
- **Auto-cleanup**: Remove empty rooms

#### 5. Data Layer
- **Primary DB**: PostgreSQL 16 (production on Render)
- **Dev DB**: SQLite (local development)
- **Cache**: Redis (session store, real-time data)
- **Migrations**: Prisma migrations (managed in `DB_prisma/prisma/migrations/`)

---

## 4. Database Schema

### User Table
```sql
User {
  id           String @id (CUID)
  name         String?
  email        String @unique
  emailVerified DateTime?
  password     String?          -- For credentials auth
  image        String?
  createdAt    DateTime
  updatedAt    DateTime
  
  Relations:
  - accounts[] (OAuth accounts)
  - tests[] (typing test history)
  - rooms[] (created multiplayer rooms)
}
```

### Account Table (OAuth)
```sql
Account {
  userId             String
  provider           String
  providerAccountId  String
  access_token       String?
  refresh_token      String?
  expires_at         Int?
  token_type         String?
  scope              String?
  
  Composite Key: [provider, providerAccountId]
  Relation: User
}
```

### Test Table (Typing Results)
```sql
Test {
  id         String @id (CUID)
  wpm        Int              -- Words per minute
  accuracy   Float            -- Percentage
  time       Int              -- Duration in seconds
  mode       String           -- "time" | "words" | "quote"
  modeOption Int              -- e.g., 60 for 60-second test
  userId     String
  createdAt  DateTime
  updatedAt  DateTime
  
  Relation: User
}
```

### Room Table (Multiplayer Sessions)
```sql
Room {
  id         String @id (CUID)
  code       String @unique   -- 6-char room code
  name       String
  mode       String           -- "time" | "words" | "quote"
  modeOption Int              -- Game duration/word count
  userId     String           -- Room creator
  createdAt  DateTime
  updatedAt  DateTime
  
  Relation: User
}
```

### VerificationToken Table
```sql
VerificationToken {
  id        String @id (CUID)
  email     String
  token     String @unique
  expiresAt DateTime
  
  Unique: [email, token]
}
```

---

## 5. Authentication System

### Authentication Architecture

**Providers**:
1. **NextAuth.js Credentials Provider**
   - Email + Password authentication
   - Uses bcryptjs for password hashing (cost factor 10)
   - Stores hashed passwords in User.password field

2. **Google OAuth 2.0**
   - Client ID/Secret from Google Cloud Console
   - Auto-verifies email for OAuth accounts
   - Allows dangerous email account linking (if user switches auth methods)
   - Profile mapping: sub → id, name, email, picture → image

### Auth Flow
```
User Login Flow:
  1. POST /auth/callback/credentials with {email, password}
  2. NextAuth validates against User.password (bcrypt compare)
  3. Returns JWT session token
  4. Stored in secure HTTP-only cookie
  5. Middleware validates on every request

User Registration:
  1. Signup form submits to auth endpoint
  2. Email validation + password hashing
  3. User record created in database
  4. Session automatically created
  5. Redirects to profile/dashboard

Google OAuth Flow:
  1. "Sign in with Google" button
  2. OAuth callback returns profile
  3. User linked to existing account or new account created
  4. Email auto-verified
  5. Session created
```

### Security Features
- **trustHost: true** - Required for reverse-proxy deployments (Render)
- **HTTP-only Cookies** - Session tokens not accessible to JavaScript
- **NextAuth.js JWT** - Stateless authentication
- **Password Hashing** - bcryptjs with salt rounds
- **Middleware Protection** - Edge-safe JWT validation without Prisma
- **Environment Variables** - Secrets never hardcoded

### Session Management
- **Default Session Provider**: NextAuth with database adapter
- **Session Duration**: Configurable TTW (default 30 days)
- **Token Refresh**: Automatic JWT refresh

---

## 6. Key Features & Components

### Feature: Typing Speed Test
**Location**: `/apps/web/app/type/page.tsx` + `components/typing/`

**Functionality**:
- Multiple test modes (time-based, word-based, quote-based)
- Real-time WPM calculation
- Accuracy tracking
- Visual feedback during typing
- Results screen with statistics

**Components**:
- `TypingInterface` - Main typing area with text display
- `Modes` - Mode selector (15s, 30s, 60s, word modes, etc.)
- `Result` - Results display with stats and options to retry/save

**Data Saved**:
- WPM (words per minute)
- Accuracy percentage
- Duration
- Mode and settings
- Timestamp

### Feature: Multiplayer Racing
**Location**: `/apps/web/app/multiplayer/page.tsx` + `components/multiplayer/`

**Functionality**:
- Create public multiplayer rooms
- Join existing rooms via code
- Real-time race synchronization via WebSocket
- Live progress tracking for all participants
- Chat during races
- Competitive leaderboard per race

**Components**:
- `CreateRoom` - Room creation form (name, mode, settings)
- `JoinRoom` - Input room code to join
- `PublicRooms` - List of available rooms (3s auto-refresh)
- `Race` - Active race interface with member progress
- `Chat` - Real-time messaging
- `Members` - Participant list with live stats
- `Result` - Race results and rankings

**WebSocket Integration**:
- Client connects to `wss://typefast-ws.onrender.com:8080`
- Sends `JOIN_ROOM` message with user and room code
- Listens for `ROOM_MEMBERS` (member list updates)
- Sends `UPDATE_PROGRESS` as user types
- Receives progress from other participants
- Race completes when host finishes or time expires

### Feature: User Profile & Stats
**Location**: `/apps/web/app/profile/page.tsx` + `components/profile/`

**Displays**:
- User's typing statistics over time
- Personal best metrics (WPM, accuracy)
- Recent test history
- Achievement badges
- Avatar and profile info

**Data Sources**:
- Test table (user's historical records)
- Pre-calculated averages/bests
- Charts via Recharts

### Feature: Leaderboard
**Location**: `/apps/web/app/leaderboard/page.tsx`

**Displays**:
- Global rankings by WPM
- Filters (all-time, monthly, weekly)
- Rankings by accuracy
- User profiles linked from leaderboard

### Feature: Authentication UI
**Location**: `/apps/web/app/auth/` + `components/auth/`

**Pages**:
- `/auth` - Login page
- `/auth/signup` - Registration form
- `/auth/forgot-password` - Password recovery
- `/auth/error` - Error messages from auth failures

**Sign-in Methods**:
- Email & password
- Google OAuth (with "Sign in with Google" button)

---

## 7. Real-time Features (WebSocket Architecture)

### WebSocket Server Implementation
**File**: `apps/ws/src/index.ts`

**Architecture**:
- Native Node.js HTTP server + ws library
- Single-threaded event-driven architecture
- In-memory state management (no external cache required)
- Graceful cleanup of disconnected users

### Message Protocol

#### Client → Server Messages
```json
{
  "type": "JOIN_ROOM",
  "userId": "user123",
  "roomCode": "ABC123",
  "userData": { "name": "John", "image": "https://..." }
}

{
  "type": "START_RACE",
  "userId": "user123",
  "roomCode": "ABC123",
  "text": "The quick brown fox..."
}

{
  "type": "UPDATE_PROGRESS",
  "userId": "user123",
  "roomCode": "ABC123",
  "progress": { "wpm": 75, "accuracy": 98.5, "progress": 45 }
}

{
  "type": "SEND_MESSAGE",
  "userId": "user123",
  "roomCode": "ABC123",
  "message": "Great race!"
}
```

#### Server → Client Messages
```json
{
  "type": "ROOM_MEMBERS",
  "members": [
    {
      "id": "user1",
      "name": "Alice",
      "image": "https://...",
      "isHost": true,
      "progress": { "wpm": 80, "accuracy": 99, "progress": 100 }
    },
    {
      "id": "user2",
      "name": "Bob",
      "image": "https://...",
      "isHost": false,
      "progress": { "wpm": 75, "accuracy": 98, "progress": 80 }
    }
  ]
}

{
  "type": "RACE_START",
  "text": "The quick brown fox jumps over the lazy dog..."
}

{
  "type": "ERROR",
  "message": "Room not found"
}
```

### Room Management
- **Room Structure**:
  - `code`: Unique 6-character identifier
  - `members`: Map of user ID → member data
  - `raceText`: Text to type (set by host)
  - `isRaceStarted`: Race state flag

- **Member Structure**:
  - `ws`: WebSocket connection
  - `user`: User data (id, name, image)
  - `isHost`: Boolean (first member becomes host)
  - `progress`: Live typing stats (WPM, accuracy, progress %)

### Key Algorithms

**Host Election**:
```typescript
const isHost = room.members.size === 0;  // First member becomes host
```

**Broadcasting**:
```typescript
// Broadcast to all room members
room.members.forEach((member) => {
  if (member.ws.readyState === WebSocket.OPEN) {
    member.ws.send(message);
  }
});
```

**Auto-cleanup**:
```typescript
// Remove room when empty
if (room && room.members.size === 0) {
  rooms.delete(roomCode);
}
```

---

## 8. Testing Infrastructure

### Unit Testing (Vitest)
**Configuration**: `vitest.config.ts` in each app

**Coverage**:
- Web app: Components, utilities, hooks, auth logic
- WS app: Message handlers, room management

**Command**:
```bash
yarn test                   # Run tests once
yarn test:watch            # Watch mode
yarn test:ui               # UI dashboard
```

### E2E Testing (Playwright)
**Configuration**: `playwright.config.ts`

**Test Files**: `e2e/browser/`

| Test Suite | Coverage |
|-----------|----------|
| `01-public-pages.spec.ts` | Home, landing pages (no auth) |
| `02-auth-flows.spec.ts` | Credentials auth, Google OAuth, logout |
| `03-typing-flow.spec.ts` | Typing interface, modes, results |
| `04-leaderboard-multiplayer.spec.ts` | Multiplayer rooms, live racing |
| `05-profile-protected.spec.ts` | Profile page, stats, history |
| `06-live-production-e2e.spec.ts` | Production-like scenarios |
| `07-live-headed-comprehensive.spec.ts` | Visual regression tests |
| `strict-auth-lifecycle.spec.ts` | Auth edge cases |
| `strict-multiplayer.spec.ts` | Multiplayer reliability |
| `strict-typing-save.spec.ts` | Data persistence |
| `render-deployment.spec.ts` | Render-specific deployment checks |

**Browsers Tested**:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox

**Configuration Details**:
- Base URL: `http://localhost:3000` (dev) or `${PLAYWRIGHT_BASE_URL}` (CI)
- Timeout: 60 seconds per test
- Retries: 0 (dev), 1 (CI)
- Parallel: Serial (1 worker) for consistency
- Screenshots: On failure only
- Traces: On first retry (debugging)

**Commands**:
```bash
yarn test:e2e                                  # Run all tests
yarn test:e2e:deploy                           # Render deployment tests
yarn test:e2e -- 02-auth-flows.spec.ts        # Specific suite
```

### Integration & API Testing
- Mock Server Worker (MSW) for mocking API responses
- Direct API endpoint testing in test files
- Database seeding for test data

---

## 9. Deployment Architecture

### Render Deployment
**Config File**: `render.yaml`

**Services Deployed**:

#### Web Service (typefast-web)
```yaml
Type: Web (Node.js)
Port: 3000
Build: yarn install && yarn web:build
Start: node start-server.js
Plan: Free tier (auto-suspends after inactivity)

Environment Variables:
- NODE_ENV=production
- DATABASE_URL=<PostgreSQL from Render>
- NEXTAUTH_SECRET=<random string>
- NEXTAUTH_URL=https://typefast-web-yogd.onrender.com
- FRONTEND_URL=https://typefast-web-yogd.onrender.com
- NEXT_PUBLIC_WS_URL=https://typefast-ws.onrender.com
- GOOGLE_CLIENT_ID=<from Google Cloud>
- GOOGLE_CLIENT_SECRET=<from Google Cloud>
```

#### WebSocket Service (typefast-ws)
```yaml
Type: Web (Node.js)
Port: 8080
Build: yarn install && cd apps/ws && yarn build
Start: cd apps/ws && yarn start
Health Check: /health endpoint
Plan: Free tier

Environment Variables:
- NODE_ENV=production
- (No external dependencies required)
```

#### Database (PostgreSQL 16)
- Attached PostgreSQL instance on Render
- Automatic daily backups (free tier)
- Environment variable: `DATABASE_URL`

#### Cache (Redis)
- Optional Redis instance for session caching
- Environment variable: `REDIS_URL`

### Docker Deployment (Local)
**Files**: `docker/Dockerfile.web`, `docker/Dockerfile.ws`, `docker-compose.yml`

**Multi-stage Builds for Optimization**:
```dockerfile
Stage 1: Builder
- Base image: node:20-alpine
- Install turbo
- Prune monorepo to specific workspace
- Reduce context size

Stage 2: Installer
- Install dependencies
- Build application
- Generate Prisma client

Stage 3: Runner
- Minimal production image
- Non-root user (nextjs:nodejs)
- Only necessary artifacts
- Health check endpoints
```

**Docker Compose Stack**:
```yaml
Services:
1. web         - Next.js app (port 3000)
2. ws          - WebSocket server (port 8080)
3. postgres    - PostgreSQL 16 (port 5432)
4. redis       - Redis 7 (port 6379)

Volumes:
- postgres_data  - Database persistence
- redis_data     - Redis persistence

Network: Docker internal network
Connection strings: service-name:port
```

**Build & Run**:
```bash
docker compose up --build          # Fresh build + start
docker compose down                # Stop and remove
docker compose logs -f web         # View logs
```

### Environment-specific Configuration
**`.env.local` (Development)**:
- `DATABASE_URL=postgresql://localhost/typefast`
- `NEXT_PUBLIC_WS_URL=ws://localhost:8080`
- `NEXTAUTH_SECRET=dev-key`

**Render Production**:
- All variables synced from Render dashboard
- Automatic DATABASE_URL from attached instance
- Secrets never committed to repository
- Health checks auto-restart unhealthy services

---

## 10. Development Workflow

### Local Setup
```bash
# 1. Install dependencies
yarn install

# 2. Generate Prisma client
yarn postinstall  # or: cd apps/web/DB_prisma && npx prisma generate

# 3. Run database migrations
cd apps/web/DB_prisma && npx prisma migrate deploy

# 4. Start development environment
yarn dev           # Starts: Next.js web + turbo dev

# 5. In separate terminal, start WebSocket server
yarn ws:dev        # or: yarn dev (if using turbo)

# 6. Open browser to http://localhost:3000
```

### Key Scripts
| Command | Purpose |
|---------|---------|
| `yarn dev` | Start all services (turbo dev) |
| `yarn build` | Build all apps (turbo build) |
| `yarn lint` | Lint all apps |
| `yarn type-check` | TypeScript type checking |
| `yarn test` | Run unit tests |
| `yarn test:e2e` | Run E2E tests (requires app running) |
| `yarn ws:dev` | WS server dev mode |
| `yarn ws:build` | WS server production build |
| `yarn docker:up` | Docker Compose startup |
| `yarn docker:down` | Docker Compose shutdown |

### Git Workflow
- Feature branches from `main`
- Pull requests with CI checks (lint, type-check, tests)
- Merge to main → auto-deploys to Render
- Test reports automatically generated

---

## 11. Security Considerations

### Authentication & Authorization
✅ **Implemented**:
- NextAuth.js for industry-standard auth
- bcryptjs for password hashing
- HTTP-only session cookies
- CSRF protection (NextAuth built-in)
- Google OAuth with secure token handling
- JWT with expiration
- Middleware route protection

⚠️ **Configuration Required**:
- Set strong `NEXTAUTH_SECRET` in production
- Set correct `NEXTAUTH_URL` and `FRONTEND_URL`
- SSL/TLS on production (Render provides)
- Secure CORS for WebSocket connections

### Data Protection
- Encrypted passwords (bcrypt, cost 10)
- User data isolated by user ID
- No sensitive data in logs (scrubbed before publication)
- Database backups enabled on Render

### API Security
- Rate limiting (should be added)
- Input validation via Zod schemas
- SQL injection prevention (Prisma ORM)
- XSS protection via React/Next.js escaping
- CORS configuration for multiplayer

---

## 12. Performance Characteristics

### Frontend
- **Next.js Turbopack**: Faster dev builds
- **Standalone Output**: Minimal Docker image
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **CSS-in-JS**: Tailwind (static generation)

### Backend
- **WebSocket Efficiency**: ws library (low overhead)
- **In-Memory Rooms**: O(1) lookup/update
- **Prisma Connection Pooling**: Single connection per context
- **Redis Caching**: Session persistence

### Database
- **PostgreSQL 16**: Modern, performant
- **Indexes**: On email (unique), room code (unique)
- **N+1 Query Prevention**: Prisma relations management
- **Connection Limits**: Render free tier: 3 connections

### Monitoring & Observability
- Console logs with prefixes: `[AUTH]`, `[WS]`, `[API]`
- Playwright reports with visual regression
- Test summaries in markdown reports
- Error tracking (app-level logging)

---

## 13. Known Limitations & Future Improvements

### Current Limitations
1. **Free Tier Constraints**:
   - Render free tier auto-suspends after 15 min inactivity
   - Limited database connections (3)
   - Limited memory per dyno (512MB)
   - No native WebSocket upgrade from HTTP (workaround: direct port)

2. **Scalability**:
   - In-memory room state (no persistence)
   - Single WS server (doesn't scale horizontally)
   - No message queue for race results
   - Session only in memory or Redis (not replicated)

3. **CORS/SSL**:
   - WebSocket may have CORS issues in some browsers
   - Self-signed certs in development

### Potential Improvements
- [ ] Horizontal scaling with Redis pub/sub
- [ ] Message persistence (MongoDB for chat)
- [ ] Gamification (badges, seasonal rankings)
- [ ] Mobile app (React Native)
- [ ] AI-powered typing hints
- [ ] Accessibility improvements
- [ ] Dark/Light theme toggle
- [ ] Custom typing passages
- [ ] Replay race recordings
- [ ] Team competitions
- [ ] API rate limiting
- [ ] Analytics dashboard (admin)

---

## 14. Directory Reference

### Web App Structure
```
apps/web/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── auth/                     # Authentication pages
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── room/
│   │   ├── leaderboard/
│   │   └── stats/
│   ├── type/                     # Typing test page
│   ├── multiplayer/              # Multiplayer lobby
│   ├── leaderboard/              # Rankings page
│   ├── profile/                  # User profile
│   └── middleware.ts             # Edge middleware
│
├── components/                   # React components
│   ├── typing/                   # Typing interface
│   ├── multiplayer/              # Multiplayer UI
│   ├── auth/                     # Auth forms
│   ├── profile/                  # Profile components
│   ├── header.tsx                # App header
│   └── landing-page/             # Home page components
│
├── lib/                          # Utility functions
│   ├── utils.ts                  # General utilities
│   └── hooks.ts                  # Custom React hooks
│
├── store/                        # Zustand state stores
├── actions/                      # Server actions
├── db/                           # Database utilities
├── common/                       # Shared entities
│   ├── src/
│   │   ├── schemas.ts            # Zod validation schemas
│   │   └── types.ts              # TypeScript types
│   └── package.json
│
├── DB_prisma/                    # Prisma configuration
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   └── migrations/           # Migration files
│   └── src/
│       └── index.ts              # Prisma client config
│
├── ui/                           # UI component library
│   ├── src/
│   │   └── components/
│   │       └── ui/               # Shadcn-like UI components
│   └── package.json
│
├── e2e/                          # E2E tests
│   └── browser/
│       ├── 01-public-pages.spec.ts
│       ├── 02-auth-flows.spec.ts
│       ├── 03-typing-flow.spec.ts
│       └── ... (12 test files)
│
├── next.config.js                # Next.js configuration
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Unit test config
├── playwright.config.ts          # E2E test config
├── auth.config.ts                # NextAuth configuration
├── auth.ts                       # NextAuth handlers (init)
├── middleware.ts                 # NextAuth middleware
├── constants/                    # App constants
├── package.json                  # Dependencies
└── .env.local                    # Local env vars
```

### WebSocket Server Structure
```
apps/ws/
├── src/
│   ├── index.ts                  # Main server code
│   └── websocket.test.ts         # Unit tests
├── dist/                         # Compiled output
├── tsconfig.json                 # TypeScript config
├── vitest.config.ts              # Test config
├── package.json                  # Dependencies
└── README.md
```

---

## 15. Key Contacts & Resources

### Technology Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [NextAuth.js Docs](https://next-auth.js.org)
- [Prisma Docs](https://www.prisma.io/docs)
- [Playwright Docs](https://playwright.dev)
- [WebSocket (ws) Docs](https://github.com/websockets/ws)
- [Render Docs](https://render.com/docs)

### Project Files
- Architecture: This document
- Implementation: `IMPLEMENTATION_SUMMARY.md`
- Testing: `STRICT_E2E_TESTS_README.md`, `TESTING_PATTERNS.md`
- Deployment: `docs/RENDER_DEPLOYMENT_GUIDE.md`
- Fixes: `docs/ERROR_FIXES_SUMMARY.md`

---

## Summary

**TypeFast** is a modern, full-stack web application demonstrating:
- ✅ Monorepo architecture with Turbo
- ✅ Real-time multiplayer via WebSockets
- ✅ Secure authentication (credentials + OAuth)
- ✅ PostgreSQL with Prisma ORM
- ✅ Comprehensive E2E testing (Playwright)
- ✅ Production deployment (Render)
- ✅ Docker containerization
- ✅ Type-safe development (TypeScript)

The system supports competitive typing tests, real-time multiplayer racing, performance tracking, and social features—all with a clean, modern tech stack optimized for developer experience and user engagement.

