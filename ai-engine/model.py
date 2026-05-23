from sentence_transformers import SentenceTransformer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_model = None

def get_model() -> SentenceTransformer:
    """
    Lazy-loads the SentenceTransformer model as a global singleton.
    This prevents reloading weights and memory leaks across API requests.
    """
    global _model
    if _model is None:
        logger.info("Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("SentenceTransformer model successfully loaded.")
    return _model
