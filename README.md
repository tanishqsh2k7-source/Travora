# Travora

AI-powered travel planning with multi-agent orchestration.

## Quick start

```bash
# Install all workspace dependencies
npm install

# Start MongoDB (requires Docker)
docker compose up -d

# Copy environment config
cp .env.example .env

# Run the API server in dev mode
npm run dev

# In another terminal, run the React client
npm run dev:client
```

The API server starts on `http://localhost:3001`. The React client starts on
`http://localhost:5173` and proxies `/api` requests to the server.

## Verify the setup

```bash
# Health check
curl http://localhost:3001/api/health

# Run all tests
npm test
```

## Project structure

This is an npm workspaces monorepo:

| Workspace             | Description                              |
| --------------------- | ---------------------------------------- |
| `packages/contracts`  | Shared Zod schemas and TypeScript types  |
| `apps/server`         | Express API server + LangGraph agents    |
| `apps/client`         | React + Vite frontend                    |

See [AGENTS.md](./AGENTS.md) for architecture details, coding rules, and
the agent design.

## Scripts

| Command             | What it does                      |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the API server (watch mode) |
| `npm run dev:client` | Start the React dev server       |
| `npm test`          | Run all workspace tests           |
| `npm run build`     | Build all workspaces              |
| `npm run docker:up` | Start MongoDB via Docker Compose  |

## Environment variables

See [`.env.example`](./.env.example) for the full list. At minimum you need
`MONGO_URI` pointing at a running MongoDB instance.

## License

Private — not for distribution.

