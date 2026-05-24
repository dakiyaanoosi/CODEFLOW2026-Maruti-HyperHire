# HyperHire AI System — Complete Technical Reference

> This document describes every component, file, algorithm, data flow, and technical detail of the HyperHire AI infrastructure.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [AI Engine — Python FastAPI Microservice](#3-ai-engine--python-fastapi-microservice)
   - [Entry Point — main.py](#31-entry-point--mainpy)
   - [Model Loader — model.py](#32-model-loader--modelpy)
   - [Core Scoring Algorithm — matcher.py](#33-core-scoring-algorithm--matcherpy)
   - [Text Compilation Utilities — utils.py](#34-text-compilation-utilities--utilspy)
   - [Pydantic Schemas — schemas.py](#35-pydantic-schemas--schemaspy)
   - [API Route Handlers — routes/matching.py](#36-api-route-handlers--routesmatchingpy)
4. [Frontend AI Integration — Next.js](#4-frontend-ai-integration--nextjs)
   - [HTTP Client — client.ts](#41-http-client--clientts)
   - [AI Service — service.ts](#42-ai-service--servicets)
   - [TypeScript Types — types.ts](#43-typescript-types--typests)
5. [UI Components](#5-ui-components)
   - [StudentAIRecommendations.tsx](#51-studentairecommendationstsx)
   - [BusinessAIRecommendations.tsx](#52-businessairecommendationstsx)
   - [AIMatchVisualization.tsx](#53-aimatchvisualizationtsx)
   - [AIExplanationCard.tsx](#54-aiexplanationcardtsx)
   - [AIInsightsWidget.tsx](#55-aiinsightswidgettsx)
   - [AISkeletonLoader.tsx](#56-aiskeletonloadertsx)
6. [The Matching Algorithm — Deep Dive](#6-the-matching-algorithm--deep-dive)
   - [Score Components](#61-score-components)
   - [Default Weights](#62-default-weights)
   - [Weighted Score Formula](#63-weighted-score-formula)
   - [Confidence Score Formula](#64-confidence-score-formula)
   - [AI Reasoning Generation](#65-ai-reasoning-generation)
7. [API Endpoints Reference](#7-api-endpoints-reference)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
   - [Student Job Recommendation Flow](#81-student-job-recommendation-flow)
   - [Business Candidate Matching Flow](#82-business-candidate-matching-flow)
9. [Environment Configuration](#9-environment-configuration)
10. [Running the AI Engine](#10-running-the-ai-engine)
11. [Where AI Surfaces in the UI](#11-where-ai-surfaces-in-the-ui)

---

## 1. Architecture Overview

HyperHire uses a **dual-service architecture** — a standalone Python microservice handles all AI computation, while the Next.js frontend consumes it through HTTP calls.

```
┌─────────────────────────────────┐          ┌──────────────────────────────────────┐
│         Next.js Frontend        │          │      HyperHire AI Engine             │
│         (Port 3000)             │          │      (Port 8000)                     │
│                                 │          │                                      │
│  ┌─────────────────────────┐   │  HTTP    │  ┌────────────────────────────────┐  │
│  │  src/services/ai/       │◄──┼──POST───►│  │  FastAPI App                   │  │
│  │  ├── client.ts          │   │          │  │  ├── /embed                    │  │
│  │  ├── service.ts         │   │          │  │  ├── /score                    │  │
│  │  └── types.ts           │   │          │  │  ├── /match                    │  │
│  └─────────────────────────┘   │          │  │  └── /recommend                │  │
│                                 │          │  └──────────┬───────────────────┘  │
│  ┌─────────────────────────┐   │          │             │                        │
│  │  src/components/ai/     │   │          │  ┌──────────▼───────────────────┐  │
│  │  ├── StudentAIRec...    │   │          │  │  matcher.py                   │  │
│  │  ├── BusinessAIRec...   │   │          │  │  (6-factor weighted scoring)  │  │
│  │  ├── AIMatchVisualiz... │   │          │  └──────────┬───────────────────┘  │
│  │  ├── AIExplanationCard  │   │          │             │                        │
│  │  ├── AIInsightsWidget   │   │          │  ┌──────────▼───────────────────┐  │
│  │  └── AISkeletonLoader   │   │          │  │  model.py                     │  │
│  └─────────────────────────┘   │          │  │  SentenceTransformer          │  │
│                                 │          │  │  all-MiniLM-L6-v2             │  │
│  Firebase / localStorage        │          │  │  384-dim dense embeddings     │  │
│  (job + user data)              │          │  └──────────────────────────────┘  │
└─────────────────────────────────┘          └──────────────────────────────────────┘
```

**Key design decisions:**
- The AI engine is **completely separate** from Next.js — it is a dedicated Python process
- The model runs **entirely locally** — no external AI API keys required
- Communication is via plain **JSON over HTTP** (REST)
- The model is loaded once as a **singleton** at startup to avoid memory spikes

---

## 2. Tech Stack

### AI Engine (Python)

| Library | Version | Role |
|---|---|---|
| `fastapi` | ≥0.110.0 | Web framework & REST API |
| `uvicorn` | ≥0.28.0 | ASGI server to run FastAPI |
| `sentence-transformers` | ≥2.5.1 | Pre-trained NLP model wrapper |
| `scikit-learn` | ≥1.4.0 | `cosine_similarity` computation |
| `numpy` | ≥1.26.0 | Vector arithmetic & clipping |
| `pydantic` | ≥2.6.0 | Request/response validation schemas |

### Frontend AI Layer (TypeScript / Next.js)

| File/Module | Role |
|---|---|
| `src/services/ai/client.ts` | Generic HTTP fetch wrapper for the AI engine |
| `src/services/ai/service.ts` | Business-logic service (getAllCandidates, matchCandidatesForJob, recommendJobsForStudent, scoreCandidateAndJob, getEmbeddings) |
| `src/services/ai/types.ts` | TypeScript interfaces mirroring the Python Pydantic schemas |

### Model

| Property | Value |
|---|---|
| **Model Name** | `all-MiniLM-L6-v2` |
| **Source** | HuggingFace via `sentence-transformers` |
| **Output Dimension** | 384-dimensional dense vectors |
| **Task** | Semantic sentence similarity via cosine distance |
| **Speed** | Very fast — designed for high-throughput local inference |
| **External calls** | None — runs fully offline after first download |

---

## 3. AI Engine — Python FastAPI Microservice

**Location:** `c:\Users\ABINISH\Desktop\HyperHire\ai-engine\`

### 3.1 Entry Point — `main.py`

**Path:** `ai-engine/main.py`

```
FastAPI app definition
├── CORS middleware (allow all origins — dev mode)
├── Startup event → eager model loading via get_model()
├── GET / → health check response
└── Registered router: routes/matching.py (tag: "Matching")
```

**Key behaviours:**
- On startup, `get_model()` is called eagerly to pre-warm the `all-MiniLM-L6-v2` model into memory. This ensures the **first API request is instant** rather than waiting ~2s for model init.
- CORS is fully open (`allow_origins=["*"]`) since both ports 3000 (Next.js) and 3001 (potential Express) need access in development.
- Logging is configured at `INFO` level with timestamped format.

---

### 3.2 Model Loader — `model.py`

**Path:** `ai-engine/model.py`

```python
_model = None  # Global singleton

def get_model() -> SentenceTransformer:
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model
```

**Design pattern:** Lazy-loading singleton.

The model is stored as a module-level global `_model`. The first call initializes it; all subsequent calls return the same instance. This avoids:
- Repeated loading of model weights (which are ~90MB)
- Memory leaks across concurrent API requests
- Cold-start latency on every request

---

### 3.3 Core Scoring Algorithm — `matcher.py`

**Path:** `ai-engine/matcher.py`

This is the **intelligence core** of HyperHire. It implements the full 6-factor matching algorithm.

#### Function signature

```python
def compute_score_and_reasoning(
    job: Dict[str, Any],
    candidate: Dict[str, Any],
    portfolios: List[Dict[str, Any]],
    weights: MatchWeights
) -> Tuple[float, float, float, ScoreBreakdown, str]:
```

#### Returns

| Return value | Type | Description |
|---|---|---|
| `match_percentage` | `int` (0–100) | Final score shown to users |
| `ranking_score` | `float` (0.0–1.0) | Used for sorting/ranking |
| `confidence_score` | `float` (0.0–1.0) | How confident the model is |
| `breakdown` | `ScoreBreakdown` | Per-factor scores |
| `reasoning` | `str` | Human-readable explanation |

#### Experience level mapping tables

```python
EXP_LEVEL_MAP = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
JOB_DIFF_MAP  = {"beginner": 1, "intermediate": 2, "advanced": 3}
```

---

### 3.4 Text Compilation Utilities — `utils.py`

**Path:** `ai-engine/utils.py`

These functions transform structured data objects into **single concatenated text strings** for embedding.

#### `compile_job_text(job)`
Builds: `Job Title: {title} | Category: {category} | Difficulty: {difficulty} | Required Skills: {skills} | Description: {description} | Deliverables: {deliverables}`

#### `compile_candidate_text(candidate)`
Builds: `College: {college} | Experience Level: {experience} | Skills: {skills} | Bio: {bio}`

#### `compile_portfolio_text(portfolio)`
Builds: `Portfolio Title: {title} | Category: {category} | Tags: {tags} | Description: {description}`

#### `get_embedding(text)` / `get_embeddings(texts)`
- Calls `model.encode()` from `sentence-transformers`
- Returns a `List[float]` (384 floats per text)
- `get_embeddings()` processes a list in a single batch call (more efficient)

---

### 3.5 Pydantic Schemas — `schemas.py`

**Path:** `ai-engine/schemas.py`

All request bodies and responses are strictly validated by Pydantic v2 models.

#### Input Models

| Model | Fields |
|---|---|
| `JobModel` | `jobId`, `businessId`, `companyName`, `title`, `description`, `category`, `requiredSkills`, `budget`, `deadline`, `difficultyLevel`, `workMode`, `deliverables`, `status`, `aiGeneratedSummary`, `aiExtractedSkills`, `aiDifficultyScore`, `createdAt`, `updatedAt` |
| `StudentProfileModel` | `name`, `college`, `bio`, `skills`, `experienceLevel`, `availability`, `preferredCategories`, `hourlyRate`, `portfolioLinks`, `trustScore`, `isVerified`, `profileStrength`, `avatarUrl` |
| `PortfolioItemModel` | `portfolioId`, `userId`, `title`, `description`, `category`, `mediaType`, `mediaUrl`, `tags`, `createdAt`, `updatedAt` |
| `CandidateWithPortfolios` | `id` (uid), `profile: StudentProfileModel`, `portfolios: List[PortfolioItemModel]` |

#### Weight Model

```python
class MatchWeights(BaseModel):
    semantic:   float = 0.30   # Semantic profile similarity
    skills:     float = 0.20   # Exact skill keyword overlap
    trust:      float = 0.15   # Trust score contribution
    experience: float = 0.10   # Experience vs difficulty match
    portfolio:  float = 0.15   # Portfolio project relevance
    category:   float = 0.10   # Preferred category alignment
```

#### Score Breakdown Model

```python
class ScoreBreakdown(BaseModel):
    semantic_similarity:  float   # Cosine similarity of profile text vs. job text
    skill_overlap:        float   # Fraction of required skills matched
    trust_score:          float   # Normalized trust score (trustScore/100)
    experience_level:     float   # Experience alignment score
    portfolio_relevance:  float   # Max portfolio-to-job cosine similarity
    category_alignment:   float   # 1.0 if preferred category matches, else 0.0
```

#### Endpoint Request/Response Models

| Endpoint | Request Model | Response Model |
|---|---|---|
| `POST /embed` | `EmbedRequest` | `EmbedResponse` |
| `POST /score` | `ScoreRequest` | `ScoreResponse` |
| `POST /match` | `MatchRequest` | `MatchResponse` |
| `POST /recommend` | `RecommendRequest` | `RecommendResponse` |

---

### 3.6 API Route Handlers — `routes/matching.py`

**Path:** `ai-engine/routes/matching.py`

All routes are registered under an `APIRouter` and included in `main.py`.

#### `POST /embed`
- Accepts: `{ "texts": ["string1", "string2", ...] }`
- Returns: `{ "embeddings": [[0.12, -0.43, ...], ...] }` — array of 384-float vectors
- Use case: Raw embedding generation for custom similarity experiments

#### `POST /score`
- Accepts: `{ "job": JobModel, "candidate": CandidateWithPortfolios, "weights": MatchWeights? }`
- Returns: `ScoreResponse` (match %, ranking score, confidence, breakdown, reasoning)
- Use case: One-to-one scoring of a single candidate against a single job

#### `POST /match`
- Accepts: `{ "job": JobModel, "candidates": [CandidateWithPortfolios], "weights": MatchWeights? }`
- Returns: `MatchResponse` with ranked list of all candidates sorted by `ranking_score` descending
- Use case: Business dashboard — rank all platform students for a given job posting

#### `POST /recommend`
- Accepts: `{ "candidate": CandidateWithPortfolios, "jobs": [JobModel], "weights": MatchWeights? }`
- Returns: `RecommendResponse` with ranked list of all jobs sorted by `ranking_score` descending
- Use case: Student dashboard — recommend the best-fit jobs for a student's profile

---

## 4. Frontend AI Integration — Next.js

### 4.1 HTTP Client — `client.ts`

**Path:** `src/services/ai/client.ts`

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";

export async function aiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T>
```

**Behaviour:**
- Reads the AI engine base URL from `NEXT_PUBLIC_AI_API_URL` environment variable (set in `.env.local`)
- Falls back to `http://127.0.0.1:8000` if env variable is not set
- Automatically sets `Content-Type: application/json` header
- Throws a descriptive error on non-2xx HTTP responses, including the response body for debugging
- All errors are re-thrown so components can catch and display error states

---

### 4.2 AI Service — `service.ts`

**Path:** `src/services/ai/service.ts`

The service layer exposes 5 public methods:

#### `aiService.getAllCandidates()`
- Fetches all student user profiles from **Firestore** (if configured) or **localStorage simulation**
- Queries `users` collection where `role == "student"`
- For each student, fetches their portfolio items via `portfolioService.getPortfolios(uid)`
- Returns: `CandidateWithPortfolios[]`

#### `aiService.matchCandidatesForJob(job, candidates, weights?)`
- Calls `POST /match` on the AI engine
- Input: one job + array of candidate profiles + optional weights override
- Returns: `MatchResponse` — ranked candidate list with scores and reasoning

#### `aiService.recommendJobsForStudent(candidate, jobs, weights?)`
- Calls `POST /recommend` on the AI engine
- Input: one candidate profile with portfolios + array of jobs
- Returns: `RecommendResponse` — ranked job list with scores and reasoning

#### `aiService.scoreCandidateAndJob(job, candidate, weights?)`
- Calls `POST /score` — single 1:1 scoring
- Returns: `ScoreResponse`

#### `aiService.getEmbeddings(texts)`
- Calls `POST /embed` — raw embedding generation
- Returns: `EmbedResponse` with 384-dim float arrays

---

### 4.3 TypeScript Types — `types.ts`

**Path:** `src/services/ai/types.ts`

TypeScript interfaces that **mirror the Python Pydantic schemas exactly**, ensuring type safety across the boundary.

| Interface | Mirrors Python Model |
|---|---|
| `MatchWeights` | `schemas.MatchWeights` |
| `ScoreBreakdown` | `schemas.ScoreBreakdown` |
| `CandidateWithPortfolios` | `schemas.CandidateWithPortfolios` |
| `ScoreResponse` | `schemas.ScoreResponse` |
| `MatchResponse` | `schemas.MatchResponse` |
| `JobScoreResponse` | `schemas.JobScoreResponse` |
| `RecommendResponse` | `schemas.RecommendResponse` |
| `EmbedRequest` / `EmbedResponse` | `schemas.EmbedRequest / EmbedResponse` |

---

## 5. UI Components

All AI UI components live in: `src/components/ai/`

### 5.1 `StudentAIRecommendations.tsx`

**Purpose:** Shows AI-ranked job recommendations on the **student dashboard**.

**Workflow:**
1. Reads `user` + `profile` from the auth store
2. Fetches the student's portfolio items via `portfolioService.getPortfolios(uid)`
3. Fetches all published jobs via `jobService.getJobs(undefined, true)`
4. Calls `aiService.recommendJobsForStudent()` → AI engine `/recommend`
5. Renders top 3 ranked job cards with expand/collapse

**Card content:** Job title, company name, match % badge (color-coded), truncated AI reasoning, `Inspect Breakdown` button  
**Expanded card:** `AIMatchVisualization` + `AIExplanationCard`

**Error states:**
- Loading → `AISkeletonLoader`
- AI engine offline → coral error panel with message
- No jobs on platform → empty state with briefcase icon

---

### 5.2 `BusinessAIRecommendations.tsx`

**Purpose:** Shows AI-ranked student candidates on the **business dashboard** and inside `JobDetailsModal` when a business user views their own job posting.

**Workflow:**
1. Accepts a `job: Job` prop
2. Calls `aiService.getAllCandidates()` — fetches all student users + their portfolios from Firestore/localStorage
3. Calls `aiService.matchCandidatesForJob(job, allCandidates)` → AI engine `/match`
4. Renders top 3 ranked candidate cards with expand/collapse

**Card content:** Candidate avatar initial, name, college, match % badge, truncated reasoning, `Inspect Fit` button  
**Expanded card:** `AIMatchVisualization` + `AIExplanationCard`

---

### 5.3 `AIMatchVisualization.tsx`

**Purpose:** Visual breakdown of the AI match score — circular gauge + per-factor bar charts.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `matchPercentage` | `number` | 0–100 overall match score |
| `confidenceScore` | `number` | 0.0–1.0 AI confidence |
| `breakdown` | `ScoreBreakdown` | All 6 factor scores |
| `compact` | `boolean` | Renders a small ring-only version |

**Full view renders:**
- Circular SVG ring (animated via `framer-motion`) with `stroke-brand-ink`
- Confidence badge (green/amber/red based on score)
- 2-column grid of 6 animated progress bars:
  - Semantic match (orange), Skill overlap (green), Portfolio relevance (yellow), Trust score (sky), Experience match (purple), Category align (blue)

**Compact view renders:**
- Small 14×14 ring with match percentage
- Confidence badge + semantic match text only

---

### 5.4 `AIExplanationCard.tsx`

**Purpose:** Shows the human-readable AI reasoning and validation factor badges.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `reasoning` | `string` | Full explanation from the AI engine |
| `breakdown` | `ScoreBreakdown` | Factor scores |
| `skillsMatched` | `string[]` | Skills present in both candidate + job |
| `experienceLevel` | `string?` | Candidate's experience level |

**Renders:**
- Header with `all-MiniLM-L6-v2` model attribution
- Reasoning paragraph in a bordered container
- Grid of up to 4 validation badges: Semantic fit %, Marketplace trust %, Experience fit, Matched skills list

**Visual:** Cream/gradient background with decorative blur blobs (peach top-right, yellow bottom-left)

---

### 5.5 `AIInsightsWidget.tsx`

**Purpose:** Sidebar widget on the dashboard. Shows different content per role.

**For business users:**
- Static market trend stats (Web Dev +32%, Video Editing +18%)
- AI assistant tip about deliverables improving match scores

**For student users (dynamic):**
- Reads the student's `bio`, `skills`, `portfolioLinks`, `hourlyRate` from their profile
- Generates up to 4 actionable suggestions if the profile is incomplete
- Shows trending skills based on whether they already have `React` (→ recommends Next.js, Framer Motion, Tailwind) or not (→ recommends Figma, UI Design, Adobe Premier)
- Shows demand trend for their first preferred category

---

### 5.6 `AISkeletonLoader.tsx`

**Purpose:** Loading placeholder shown while AI engine requests are in-flight.

**Renders:**
- Animated pulsing rows mimicking the recommendation card layout
- Customizable `message` prop text (e.g. "Generating customized job recommendations…")

---

## 6. The Matching Algorithm — Deep Dive

### 6.1 Score Components

The algorithm in `matcher.py → compute_score_and_reasoning()` computes 6 independent scores:

#### 1. Semantic Similarity (`semantic_sim`)
- Converts both the **job description** and **candidate profile** into natural language text using the `compile_*_text()` helpers
- Encodes both texts into 384-dimensional vectors via `model.encode()`
- Computes **cosine similarity** using `sklearn.metrics.pairwise.cosine_similarity`
- Result: `float` clamped to `[0.0, 1.0]`

> **Example:** A job posting for "React frontend developer with TypeScript" and a student profile with "Skills: React, TypeScript, JavaScript | Experience: Intermediate | Bio: Web developer specializing in modern frontend" will produce a high cosine similarity because their vector representations will be close in the 384-dimensional embedding space.

#### 2. Skill Overlap (`skill_overlap`)
- Converts both sets to lowercase stripped strings
- Computes set intersection: `matched_skills = set(candidate_skills) ∩ set(required_skills)`
- `skill_overlap = len(matched_skills) / len(required_skills)`
- If no required skills defined → `skill_overlap = 1.0` (no penalty)

#### 3. Trust Score (`trust_score`)
- Raw trust score comes from `candidate.trustScore` (stored on user profile, default 80)
- Normalized: `trust_score = trustScore / 100.0`
- Clamped to `[0.0, 1.0]`

#### 4. Experience Level Match (`exp_score`)
- Maps candidate's `experienceLevel` to a numeric tier: Beginner=1, Intermediate=2, Advanced=3, Expert=4
- Maps job's `difficultyLevel` to a numeric tier: Beginner=1, Intermediate=2, Advanced=3
- If `candidate_level >= job_level` → `exp_score = 1.0` (candidate is qualified)
- If under-qualified → `exp_score = candidate_level / job_level` (partial credit)

#### 5. Portfolio Relevance (`portfolio_relevance`)
- For each portfolio item, compiles text via `compile_portfolio_text()` and encodes it
- Computes cosine similarity between each **portfolio embedding** and the **job embedding**
- Takes the **maximum** similarity across all portfolio items
- If no portfolio → `portfolio_relevance = 0.0`

#### 6. Category Alignment (`category_score`)
- Checks if `job.category` (lowercased) is present in the candidate's `preferredCategories` list
- `1.0` if match, `0.0` if not — binary signal

---

### 6.2 Default Weights

```
semantic   = 0.30  →  30% of final score
skills     = 0.20  →  20% of final score
trust      = 0.15  →  15% of final score
experience = 0.10  →  10% of final score
portfolio  = 0.15  →  15% of final score
category   = 0.10  →  10% of final score
─────────────────────────────────────────
TOTAL      = 1.00  →  100%
```

Weights are **normalized** at runtime: each weight is divided by the sum of all weights, so even if custom weights don't sum to 1.0, the math stays correct.

---

### 6.3 Weighted Score Formula

```
ranking_score = (w_sem × semantic_sim)
              + (w_sk  × skill_overlap)
              + (w_tr  × trust_score)
              + (w_ex  × exp_score)
              + (w_po  × portfolio_relevance)
              + (w_ca  × category_score)

match_percentage = round(ranking_score × 100)
match_percentage = clamp(match_percentage, 0, 100)
```

---

### 6.4 Confidence Score Formula

The confidence score measures how **reliable** the match is, emphasizing the two most meaningful signals:

```
confidence_score = clamp(semantic_sim × 0.6 + skill_overlap × 0.4, 0.0, 1.0)
```

| confidence_score | Label | Badge Color |
|---|---|---|
| ≥ 0.8 | High Confidence | Green |
| ≥ 0.5 | Medium Confidence | Amber |
| < 0.5 | Lower Confidence | Red/Coral |

---

### 6.5 AI Reasoning Generation

The reasoning string is built procedurally in `matcher.py` (not by an LLM):

**Step 1 — Positive reasons array:**
- If `portfolio_relevance > 0.65` AND portfolio exists → adds `"highly relevant portfolio projects like '{best_portfolio_title}'"`
- If `skill_overlap > 0.5` AND matched skills exist → adds `"strong matching skills in {skill1}, {skill2}, ..."`
- Else if `semantic_sim > 0.65` → adds `"close semantic alignment between their profile and the job description"`

**Step 2 — Supporting extras array:**
- If `trustScore >= 80` → adds `"a high trust score ({score}%)"`
- If `exp_score == 1.0` → adds `"experience level ({level}) that matches the job difficulty"`
- If `category_score == 1.0` → adds `"direct category preference alignment"`

**Step 3 — Final string assembly:**
```
"Recommended because the candidate has {reasons}, backed by {extras}."
```

Example output:
> *"Recommended because the candidate has strong matching skills in React, TypeScript, and Tailwind, backed by a high trust score (85%) and experience level (Intermediate) that matches the job difficulty."*

---

## 7. API Endpoints Reference

**Base URL:** `http://127.0.0.1:8000` (configurable via `NEXT_PUBLIC_AI_API_URL`)

| Method | Path | Purpose | Caller |
|---|---|---|---|
| `GET` | `/` | Health check | Manual / Monitoring |
| `POST` | `/embed` | Generate raw vector embeddings | `aiService.getEmbeddings()` |
| `POST` | `/score` | Score one candidate vs one job | `aiService.scoreCandidateAndJob()` |
| `POST` | `/match` | Rank N candidates for one job | `aiService.matchCandidatesForJob()` → `BusinessAIRecommendations` |
| `POST` | `/recommend` | Rank N jobs for one candidate | `aiService.recommendJobsForStudent()` → `StudentAIRecommendations` |

**Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)

---

## 8. Data Flow Diagrams

### 8.1 Student Job Recommendation Flow

```
User opens Dashboard (student)
        │
        ▼
StudentAIRecommendations.tsx mounts
        │
        ├─ portfolioService.getPortfolios(uid) ─► Firestore/localStorage
        │                                          Returns: PortfolioItem[]
        │
        ├─ jobService.getJobs(undefined, true) ─► Firestore/localStorage
        │                                          Returns: Job[] (published)
        │
        └─ aiService.recommendJobsForStudent(candidate, jobs)
                │
                └─► POST http://127.0.0.1:8000/recommend
                            │
                            ├─ For each job:
                            │   ├─ compile_job_text() → job embedding
                            │   ├─ compile_candidate_text() → candidate embedding
                            │   ├─ compile_portfolio_text() × N → portfolio embeddings
                            │   └─ compute_score_and_reasoning()
                            │       ├─ semantic_similarity (cosine)
                            │       ├─ skill_overlap (set intersection)
                            │       ├─ trust_score (normalized)
                            │       ├─ exp_score (tier comparison)
                            │       ├─ portfolio_relevance (max cosine)
                            │       └─ category_alignment (binary)
                            │
                            └─ Sort descending → RecommendResponse
                                        │
                                        ▼
                    StudentAIRecommendations renders top 3 jobs
                    Each card: match %, company, title, reasoning
                    Expanded: AIMatchVisualization + AIExplanationCard
```

### 8.2 Business Candidate Matching Flow

```
Business user views JobDetailsModal OR Dashboard
        │
        ▼
BusinessAIRecommendations.tsx mounts (receives job prop)
        │
        ├─ aiService.getAllCandidates()
        │   ├─ Firestore: query users WHERE role == "student"
        │   └─ For each student: portfolioService.getPortfolios(uid)
        │   Returns: CandidateWithPortfolios[]
        │
        └─ aiService.matchCandidatesForJob(job, allCandidates)
                │
                └─► POST http://127.0.0.1:8000/match
                            │
                            ├─ For each candidate:
                            │   └─ compute_score_and_reasoning()
                            │
                            └─ Sort descending → MatchResponse
                                        │
                                        ▼
                    BusinessAIRecommendations renders top 3 candidates
                    Each card: avatar initial, name, college, match %, reasoning
                    Expanded: AIMatchVisualization + AIExplanationCard
```

---

## 9. Environment Configuration

**File:** `.env.local` (at the Next.js project root)

```env
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8000
```

This variable is read in `src/services/ai/client.ts`:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://127.0.0.1:8000";
```

**To change the AI engine URL** (e.g. for deployment):
- Update `.env.local` only — no code changes needed
- The `NEXT_PUBLIC_` prefix makes it available in browser-side code

---

## 10. Running the AI Engine

**Prerequisites:** Python 3.9+, virtual environment activated

```powershell
# Navigate to AI engine folder
cd ai-engine

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the development server
uvicorn main:app --reload --port 8000
```

**On startup you will see:**
```
INFO: Starting up HyperHire AI Engine...
INFO: Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...
INFO: SentenceTransformer model successfully loaded.
INFO: Application startup complete.
INFO: Uvicorn running on http://127.0.0.1:8000
```

**Swagger UI available at:** `http://localhost:8000/docs`

The `--reload` flag enables hot-reload on code changes.

---

## 11. Where AI Surfaces in the UI

| Page / Component | AI Feature | Endpoint Used |
|---|---|---|
| `dashboard/page.tsx` (student) | AI Recommended Gigs section | `POST /recommend` |
| `dashboard/page.tsx` (business) | Top Matching Candidates for first published job | `POST /match` |
| `JobDetailsModal.tsx` (canManage=true) | Candidate recommendations inside job detail drawer | `POST /match` |
| `AIInsightsWidget.tsx` | Profile optimization tips (dynamic, no API call) | None — client-side logic only |
| `MarketplaceFeed.tsx` | Job cards show local skill fit scores (no API call) | None — `marketplace-utils.ts` local scoring |
| `MarketplaceJobDetailModal.tsx` | If `aiBreakdown` is present on job: shows full visualization | Pre-computed on job object |

---

## File Index

| File | Location | Purpose |
|---|---|---|
| `main.py` | `ai-engine/` | FastAPI app entry point |
| `model.py` | `ai-engine/` | Singleton model loader |
| `matcher.py` | `ai-engine/` | Core 6-factor scoring algorithm |
| `utils.py` | `ai-engine/` | Text compilers + embedding helpers |
| `schemas.py` | `ai-engine/` | Pydantic request/response schemas |
| `routes/matching.py` | `ai-engine/routes/` | REST route handlers |
| `requirements.txt` | `ai-engine/` | Python dependency list |
| `client.ts` | `src/services/ai/` | Typed HTTP fetch wrapper |
| `service.ts` | `src/services/ai/` | Business logic service layer |
| `types.ts` | `src/services/ai/` | TypeScript type definitions |
| `StudentAIRecommendations.tsx` | `src/components/ai/` | Student dashboard AI card list |
| `BusinessAIRecommendations.tsx` | `src/components/ai/` | Business candidate match list |
| `AIMatchVisualization.tsx` | `src/components/ai/` | Circular gauge + factor bars |
| `AIExplanationCard.tsx` | `src/components/ai/` | Reasoning text + validation badges |
| `AIInsightsWidget.tsx` | `src/components/ai/` | Profile optimizer + market tips |
| `AISkeletonLoader.tsx` | `src/components/ai/` | Loading skeleton placeholder |
| `.env.local` | `./` (project root) | `NEXT_PUBLIC_AI_API_URL` config |
