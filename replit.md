# State Sandbox AI — Project Overview

## Architecture

- **Frontend**: Next.js 15 (App Router), running on port 5000 with `-H 0.0.0.0`
  - `frontend/src/app/` — Next.js app routes
  - `frontend/src/components/` — React components
  - `frontend/src/components/game/` — All game components (GameHub, WorldMap, CityBuilder, TechTree, Diplomacy, MilitaryCommand)
- **Backend**: FastAPI (Python), running on port 8000
  - `backend/main.py` — FastAPI entrypoint
  - `backend/routers/` — API routers (game, ai, auth, state, etc.)
  - `backend/model/` — Game config, map generation, DB models
  - `backend/db/` — Database session and models

## Workflows

- `Backend API`: `cd backend && python main.py`
- `Start application`: `cd frontend && npm run dev`

## Game Features (State Sandbox AI)

A political + strategy simulation game combining:
- **Freeciv-style hex world map** (38×24 tiles, procedural generation with terrain)
- **12 military unit types** (Warrior, Archer, Spearman, Catapult, Knight, Musketeer, Cannon, Rifleman, Tank, Artillery, Fighter, Bomber)
- **20-tech research tree** across 5 eras (Ancient → Information)
- **20×20 grid city builder** (Micropolis-style) with zones, services, and military buildings
- **Diplomacy system** (gifts, trade, alliances, denounce)
- **AI countries** with personalities (aggressive, diplomatic, scientific, economic, militaristic)
- **Turn-based engine** with end-turn advancing AI

## Key Files

- `frontend/src/app/state/page.js` — State page (hosts all tabs including 🌍 Strategy tab)
- `frontend/src/components/game/GameHub.js` — Master game UI with tab navigation
- `frontend/src/components/game/WorldMap.js` — SVG hex grid world map
- `frontend/src/components/game/CityBuilder.js` — City grid builder
- `frontend/src/components/game/TechTree.js` — Research tech tree
- `frontend/src/components/game/Diplomacy.js` — Diplomacy relations panel
- `frontend/src/components/game/MilitaryCommand.js` — Unit roster and training
- `backend/routers/game.py` — All game API endpoints
- `backend/model/game_config.py` — Unit, tech, building, terrain definitions
- `backend/model/map_gen.py` — Procedural hex map generator
- `backend/db/models.py` — All database models (including GameState, MilitaryUnit, GameCity, etc.)

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string
- `OPENAI_API_KEY` — For AI turns and reports
- `JWT_SECRET_KEY` — Authentication
- `STRIPE_SECRET_KEY` — Payments
- `STRIPE_WEBHOOK_SECRET` — Stripe webhooks
- `POSTMARK_API_KEY` — Email delivery
- `FRONTEND_URL` — Frontend origin URL

## npm Install Note

Always use `--legacy-peer-deps` (react-svg@16 is incompatible with React 19).
