# Sleekflow To-Do List Application

A modern, full-stack to-do list application with React frontend, Express backend, and Supabase database.

## 🚀 Quick Start

```bash
# Install all dependencies
npm run install:all

# Configure environment
# Edit .env with your Supabase credentials

# Run development servers (frontend + backend)
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## 🏗️ Project Structure

```
├── backend/     # Express API (TypeScript)
├── frontend/    # React App (TypeScript + Vite)
├── docs/        # Project documentation (TBD)
└── .env         # Shared environment variables
```

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Express, TypeScript, Node.js
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth

## 📦 Scripts

- `npm run dev` - Run both servers concurrently
- `npm run dev:frontend` - Frontend only
- `npm run dev:backend` - Backend only
- `npm run build` - Build for production
- `npm run install:all` - Install all dependencies

## 🔐 Environment Variables

See `.env.example` for required configuration.

## 📄 License

ISC
