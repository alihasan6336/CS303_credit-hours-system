# CS303 Course Project

A full-stack web application with React (Vite + TypeScript) frontend and Express (TypeScript) backend.

## Project Structure

```
CS303/
├── client/              # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API calls
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env             # Environment variables
│   └── package.json
│
├── server/              # Express backend (TypeScript)
│   ├── src/
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── config/      # Configuration files
│   │   └── server.ts    # Entry point
│   ├── .env             # Environment variables
│   └── package.json
│
└── mobile/              # Mobile app (future)
```

## Setup Instructions

### Prerequisites

- Node.js 20.12.2+
- npm 10.5.0+

### Client Setup

```bash
cd client
npm install
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production
```

### Server Setup

```bash
cd server
npm install
npm run dev          # Start development server (http://localhost:3001)
npm run build        # Compile TypeScript
npm start            # Run production server
```

## Environment Variables

### Client (.env)

```
VITE_API_URL=http://localhost:3001
```

### Server (.env)

```
PORT=3001
NODE_ENV=development
```

## Available Endpoints

### Server

- `GET /` - Welcome message
- `GET /api/health` - Health check endpoint

## Tech Stack

### Frontend

- React 19.2.0
- TypeScript 5.9.3
- Vite 7.3.1

### Backend

- Express 5.2.1
- TypeScript 5.9.3
- Node.js with ts-node
- dotenv for environment variables
- cors for cross-origin requests

## Development Status

✅ Clean setup ready for development
✅ Client running on http://localhost:5173
✅ Server running on http://localhost:3001
✅ TypeScript configured for both projects
✅ Folder structure organized and ready
