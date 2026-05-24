from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.matching import router as matching_router
from routes.chat import router as chat_router
from model import get_model
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HyperHire AI Engine",
    description="Dedicated FastAPI microservice running sentence-transformers all-MiniLM-L6-v2 for hyperlocal semantic talent matching.",
    version="1.0.0"
)

# CORS Configuration
# Next.js frontend runs on port 3000, and Express server on 3001. Allow cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("Starting up HyperHire AI Engine...")
    try:
        # Eagerly load the model during startup so the first request is instant
        get_model()
        logger.info("Eager model loading complete.")
    except Exception as e:
        logger.error(f"Failed to load model on startup: {e}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "HyperHire AI Engine",
        "model": "all-MiniLM-L6-v2"
    }

# Register API Routers
app.include_router(matching_router, tags=["Matching"])
app.include_router(chat_router, tags=["HyperAI Chat"])
