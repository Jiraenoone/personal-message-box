# Personal Message Box

A full-stack web application that allows users to create personal message boxes with QR codes. Visitors can scan QR codes and send text messages, images, and videos — all stored securely in the owner's Google Drive.

## Tech Stack

- **Frontend**: React + Vite + JavaScript
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM
- **Storage**: Google Drive API
- **Auth**: JWT (httpOnly cookies) + bcrypt

> **Dev storage fallback:** when Google OAuth is not configured (or the owner's Drive connection is the
> seeded mock), attachments are saved to `backend/uploads/` instead of Google Drive. This only applies
> when `NODE_ENV` is not `production`.

## Prerequisites

- Node.js v18+
- PostgreSQL 14+
- Google Cloud Project with Drive API enabled

## Getting Started

### 1. Clone and install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Copy example env file
cd backend
copy .env.example .env
# Edit .env with your database URL and Google OAuth credentials
```

### 3. Set up database

```bash
cd backend
npm run db:deploy   # apply migrations (prisma/migrations)
npm run db:seed     # dev account test@example.com / test123456 + mock Drive connection
```

### 4. Run development servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### 6. Run the API test suite

With the backend running (and seeded):

```bash
cd backend
npm run test:e2e
```

It creates and removes its own temporary boxes/user. The public submit limit is 10/min per IP,
so wait a minute between runs.

## Deploying to Production

The simplest setup is **single-origin**: Express serves both the API and the built React app,
so cookies, CORS and media streaming all work on one domain behind HTTPS.

1. **Google Cloud**: create an OAuth client (Web application), enable the Drive API, and add
   `https://YOUR-DOMAIN/api/google-drive/callback` as an authorized redirect URI. The app only
   requests the `drive.file` scope (it can see only files it created).
2. **Build the frontend**: `cd frontend && npm ci && npm run build` → `frontend/dist`
3. **Backend env** (`backend/.env` or your host's env settings):

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | your PostgreSQL URL |
   | `FRONTEND_URL`, `BACKEND_URL` | `https://YOUR-DOMAIN` (both the same) |
   | `SERVE_FRONTEND` | `true` |
   | `TRUST_PROXY` | `1` (behind one proxy / load balancer) |
   | `JWT_SECRET`, `ENCRYPTION_KEY` | 64-char random hex each: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | from step 1 |

   The server refuses to start in production with placeholder secrets.
   **Keep `ENCRYPTION_KEY` safe and stable**: changing it makes stored Google tokens unreadable
   (every owner would have to reconnect Drive).
4. **Database**: `cd backend && npm ci && npm run db:deploy` (do **not** run the seed in production).
5. **Start**: `npm start` (handles SIGTERM gracefully). Health check: `GET /api/health`.

Notes:
- Uploads are staged in the OS temp dir then streamed to Drive, so the host needs enough temp disk
  for concurrent uploads (up to ~150 MB per submission) and the proxy must allow request bodies of
  at least ~160 MB (e.g. Nginx `client_max_body_size 160m;`) and long upload timeouts.
- Rate limits and the Google OAuth `state` store are in memory, so run **one instance**
  (or move them to Redis before scaling out).
- Logging out clears the cookie, but issued JWTs stay valid until expiry (`JWT_EXPIRES_IN`, default 7d).

## Project Structure

```
personal-message-box/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API service functions
│   │   ├── hooks/       # Custom React hooks
│   │   ├── context/     # React context providers
│   │   └── utils/       # Utility functions
│   └── vite.config.js
│
├── backend/           # Node.js + Express backend
│   ├── prisma/        # Database schema & migrations
│   └── src/
│       ├── config/      # Configuration
│       ├── controllers/ # Route controllers
│       ├── middleware/  # Express middleware
│       ├── routes/      # API routes
│       ├── services/    # Business logic
│       ├── utils/       # Utility functions
│       └── validators/  # Input validation
│
└── README.md
```

## API Endpoints

| Group | Endpoint | Description |
|-------|----------|-------------|
| Health | `GET /api/health` | Server health check |
| Auth | `POST /api/auth/register` | Create account |
| Auth | `POST /api/auth/login` | Login |
| Auth | `POST /api/auth/logout` | Logout |
| Drive | `GET /api/google-drive/connect` | Connect Google Drive |
| Boxes | `GET /api/boxes` | List message boxes |
| Public | `GET /api/public/boxes/:slug` | Public box info |
| Public | `POST /api/public/boxes/:slug/messages` | Submit message (multipart, 10/min per IP) |
| Messages | `GET /api/boxes/:id/messages?page=&limit=&filter=image\|video\|text&search=` | Owner inbox (paginated) |
| Messages | `GET /api/boxes/:id/messages/:msgId` | Message detail + attachments |
| Messages | `DELETE /api/boxes/:id/messages/:msgId` | Delete message + its Drive files |
| Messages | `DELETE /api/boxes/:id/messages` | Delete all messages in a box |
| Media | `GET /api/messages/:msgId/files/:fileId` | Owner-only file stream (HTTP Range for video seeking) |

## License

ISC
