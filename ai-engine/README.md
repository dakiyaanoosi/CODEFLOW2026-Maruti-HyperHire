# HyperHire AI Engine

This is a dedicated, production-grade Python FastAPI microservice that serves as the core intelligence layer of HyperHire. It processes semantic data to match businesses with relevant student talent using vector embeddings and multi-factor weighted scoring.

## Core Features
1. **Semantic Embeddings**: Uses the pre-trained `all-MiniLM-L6-v2` model from `sentence-transformers` to generate dense 384-dimensional vector embeddings locally (no external API calls).
2. **Multi-Factor Ranking**: Ranks candidates based on:
   - **Semantic Similarity** (Cosine similarity of profile vs. job descriptions)
   - **Skill Overlap** (Exact keyword matching ratio)
   - **Trust Score** (Student rating and reliability metric)
   - **Experience Alignment** (Candidate experience compared to job difficulty)
   - **Portfolio Relevance** (Max cosine similarity of job vs. portfolio projects)
   - **Category Preference** (Explicit category alignment check)
3. **Explainable AI**: Generates human-readable, dynamic justifications for recommendations based on computed scores.

---

## Folder Structure
```txt
/ai-engine
  ├── main.py              # Entry point & CORS configuration
  ├── model.py             # Global singleton loader for SentenceTransformer
  ├── matcher.py           # Core scoring algorithm & explanation text compiler
  ├── schemas.py           # Pydantic input/output validation schemas
  ├── requirements.txt     # Python packages
  ├── utils.py             # Helper functions for text compilation & embedding requests
  ├── routes/
  │     └── matching.py    # Route handlers for /embed, /score, /match, and /recommend
  └── venv/                # Local Python virtual environment
```

---

## Local Setup & Execution

### 1. Requirements
Ensure Python 3.9+ is installed on your machine.

### 2. Setup Virtual Environment
Run the following commands from the `/ai-engine` folder:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Dev Server
```bash
uvicorn main:app --reload --port 8000
```
The interactive API documentation will be available at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## Endpoints

### 1. `POST /embed`
Returns raw vector embeddings for a list of strings.
- **Payload**: `{"texts": ["Developer with React skills", "Video editor"]}`

### 2. `POST /score`
Scores a single candidate against a single job.

### 3. `POST /match`
Ranks a list of candidates against a single job, returning match percentages and reasonings.

### 4. `POST /recommend`
Ranks a list of jobs for a single candidate.
