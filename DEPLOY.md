# Deployment Guide — State Sandbox

## Deploy on Vercel (Recommended)

### Prerequisites
- [Vercel account](https://vercel.com)
- [Neon PostgreSQL](https://neon.tech) (free tier works)
- OpenAI API key **and/or** Google AI API key

### Step 1: Set up the database (Neon)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the **Connection string** (DATABASE_URL) and the **Direct connection** (DIRECT_URL)

### Step 2: Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repository
3. Set **Root Directory** to `frontend`
4. Add environment variables:

```
DATABASE_URL          = your-neon-connection-string
DIRECT_URL            = your-neon-direct-connection-string
JWT_SECRET            = any-random-32-char-string
OPENAI_API_KEY        = sk-...      (for OpenAI)
GOOGLE_API_KEY        = AIza...     (for Gemini)
AI_PROVIDER           = openai      (default provider: openai or gemini)
FRONTEND_URL          = https://your-app.vercel.app
CREDITS_DEFAULT       = 10
CREDITS_NEW_STATE_COST = 1
CREDITS_NEXT_YEAR_COST = 1
```

5. Click **Deploy**

### Step 3: Initialize the database

After deployment, run the database migration:

```bash
cd frontend
npx prisma db push
```

Or via Vercel's deploy hook, the `npm run db:generate && npm run build` command handles this.

---

## AI Provider Configuration

### OpenAI (Default)
Set `AI_PROVIDER=openai` and provide `OPENAI_API_KEY`.

**Available models:**
- `o3-mini-2025-01-31` — Best reasoning (recommended)
- `o4-mini` — Latest fast reasoning
- `gpt-4o` — Fast and capable
- `o1` — Advanced reasoning

### Google Gemini
Set `AI_PROVIDER=gemini` and provide `GOOGLE_API_KEY`.

**Available models:**
- `gemini-3.1-pro-preview` — Latest and most advanced ✨
- `gemini-3.0-pro-preview` — Next generation pro
- `gemini-2.5-pro-preview-05-06` — Most capable (recommended)
- `gemini-2.5-flash-preview-05-20` — Latest fast model
- `gemini-2.0-pro-exp` — High capability
- `gemini-2.0-flash-thinking-exp` — Fast with reasoning
- `gemini-2.0-flash` — Fastest option

### Per-user configuration
Users can change their AI provider and model in the game's **AI Settings** (⚙ icon in the top bar).
They can also provide their own API key which is stored locally in their browser.

---

## Local Development

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your values

npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

In development mode, the magic link token is returned directly in the API response
so you can test without email setup.

---

## Architecture

```
frontend/                    ← Next.js app (deploy to Vercel)
├── src/
│   ├── app/
│   │   ├── api/             ← Next.js API routes (serverless)
│   │   │   ├── auth/        ← Authentication endpoints
│   │   │   ├── states/      ← Game state endpoints
│   │   │   └── ai/          ← AI model listing
│   │   ├── auth/            ← Login + verify pages
│   │   ├── create/          ← Country creation
│   │   └── game/[id]/       ← Main game view
│   ├── components/
│   │   └── game/            ← WorldMap, Diplomacy, Military, TechTree...
│   └── lib/
│       ├── ai/              ← OpenAI + Gemini providers
│       ├── db/              ← Prisma client
│       └── game/            ← Game simulation logic
└── prisma/schema.prisma     ← Database schema
```

## Tech Stack
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn/UI
- **Backend**: Next.js API routes (serverless)
- **Database**: PostgreSQL via Prisma (Neon recommended)
- **AI**: OpenAI (o3-mini, o4-mini, GPT-4o) + Google Gemini (2.0 Flash → 3.1 Pro Preview)
- **Map**: react-simple-maps
- **Auth**: Magic links via email (JWT)
