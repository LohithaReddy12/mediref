MedRef — Local Scaffold

Run locally with Docker Compose (Node & Vite):

```bash
# build and start
docker-compose up --build
```

Backend: http://localhost:4000
Frontend: http://localhost:5173

Recommended workflow

1. Copy `.env.example` to `.env` and adjust ports as needed.

```bash
cp .env.example .env
```

2. Start services:

```bash
docker-compose up --build
```

3. Open the frontend at the port specified in `.env` (default 5173).

Run backend locally without Docker (optional):

```bash
cd backend
npm install
npm run dev
```

Run frontend locally without Docker (optional):

```bash
cd frontend
npm install
npm run dev
```
