# Sleekflow To-Do List

A collaborative task management application built with React and Express. Features personal and team workspaces, real-time updates, and a calendar view for managing tasks.

## Features

- Personal and team task management with mode switching
- Real-time collaboration using Supabase subscriptions
- Calendar view for visualizing tasks
- Work session tracking
- Push notifications for deadlines and team invitations
- Glassmorphism UI design

## Setup

Install dependencies for both frontend and backend:

```bash
npm run install:all
```

Configure your database connection in `.env` (see `docs/Getting-Started.md` for details):

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Start the development servers:

```bash
npm run dev
```

Frontend runs on http://localhost:5173, backend on http://localhost:3000.

## Project Structure

- **frontend/** - React application with TypeScript
- **backend/** - Express API server
- **docs/** - Documentation and setup guides

## Tech Stack

- Frontend: React 18, TypeScript, Vite
- Backend: Express, TypeScript
- Database: PostgreSQL (Supabase)
- Authentication: Supabase Auth
- Real-time: Supabase Realtime

## Available Scripts

```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only
npm run build            # Production build
```

## Documentation

See the `docs` folder for detailed information on project structure and setup instructions.
