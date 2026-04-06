import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
import asyncio

from db.database import init_db
from tasks.tasks import reset_stuck_states
from routers import auth, states, stripe, game


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize in-memory cache
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

    # Start background task to reset stuck states
    reset_task = asyncio.create_task(reset_stuck_states())

    yield

    # Cleanup background task
    reset_task.cancel()
    try:
        await reset_task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)

# Configure CORS
_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5000",
    "http://localhost:8000",
    "https://*.up.railway.app",
    "https://*.replit.dev",
    "https://*.replit.app",
    "https://*.repl.co",
]
if _frontend_url and _frontend_url not in _allowed_origins:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"https://.*\.(replit\.dev|replit\.app|repl\.co)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(states.router)
app.include_router(stripe.router)
app.include_router(game.router)

if __name__ == "__main__":
    import uvicorn

    init_db()
    uvicorn.run(app, host="0.0.0.0", port=8000)
