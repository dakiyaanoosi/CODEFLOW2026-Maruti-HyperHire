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
   - [Model Orchestrator & LLM Handler — generation.py](#36-model-orchestrator--llm-handler--generationpy)
   - [Rule-Based Contextual Fallback — chat_engine.py](#37-rule-based-contextual-fallback--chat_enginepy)
4. [API Routers Reference](#4-api-routers-reference)
   - [Matching Router — routes/matching.py](#41-matching-router)
   - [Optimization Router — routes/optimization.py](#42-optimization-router)
   - [Workforce Talent Discovery — routes/talent.py](#43-workforce-talent-discovery)
   - [Reputation & Trust Tracker — routes/trust.py](#44-reputation--trust-tracker)
   - [Workflow Coordinator — routes/workflow.py](#45-workflow-coordinator)
   - [HyperAI Chat Engine — routes/chat.py](#46-hyperai-chat-engine)
   - [Ecosystem Context Analyzer — routes/context.py](#47-ecosystem-context-analyzer)
   - [Semantic Analytics Heatmap — routes/analytics.py](#48-semantic-analytics-heatmap)
5. [Security & Protection Infrastructure](#5-security--protection-infrastructure)
   - [Authentication & JWT Session — security/auth.py](#51-authentication--jwt-session)
   - [Role-Based Access Controls — security/rbac.py](#52-role-based-access-controls)
   - [Token Bucket Rate Limiter — security/rate_limiter.py](#53-token-bucket-rate-limiter)
   - [Payload & File Upload Protection — security/file_upload.py](#54-payload--file-upload-protection)
   - [Field-Level Database Encryption — security/encryption.py](#55-field-level-database-encryption)
6. [Frontend AI Integration — Next.js](#6-frontend-ai-integration--nextjs)
7. [UI Components](#7-ui-components)
8. [The Matching Algorithm — Deep Dive](#8-the-matching-algorithm--deep-dive)
9. [API Endpoints Reference Table](#9-api-endpoints-reference-table)
10. [Ecosystem Data Flows](#10-ecosystem-data-flows)
11. [Environment & Deployment Setup](#11-environment--deployment-setup)

---

## 1. Architecture Overview

HyperHire uses a **dual-service architecture** where a standalone Python microservice handles all AI calculations and NLP workflows, while the Next.js frontend interacts with it using secure HTTP calls.

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
│  └─────────────────────────┘   │          │  └── [17 Endpoints Registered]  │  │
│                                 │          │  └──────────┬───────────────────┘  │
│  ┌─────────────────────────┐   │          │             │                        │
│  │  src/components/ai/     │   │          │  ┌──────────▼───────────────────┐  │
│  │  ├── StudentAIRec...    │   │          │  │  matcher.py / chat_engine.py  │  │
│  │  ├── BusinessAIRec...   │   │          │  │  (Multi-factor reasoning)    │  │
│  │  ├── AIMatchVisualiz... │   │          │  └──────────┬───────────────────┘  │
│  │  └── ...                │   │          │             │                        │
│  └─────────────────────────┘   │          │  ┌──────────▼───────────────────┐  │
│                                 │          │  │  model.py (HuggingFace)      │  │
│  Firebase / localStorage        │          │  │  all-MiniLM-L6-v2             │  │
│  (job + user data)              │          │  │  384-dim dense embeddings     │  │
│  (Cloudinary Storage)           │          │  └──────────────────────────────┘  │
└─────────────────────────────────┘          └──────────────────────────────────────┘
```

**Key design decisions:**
*   **Decoupled microservice**: The AI engine runs in an isolated Python environment, protecting Node.js client threads from ML computation spikes.
*   **Offline capability**: The core similarity model runs locally on the host CPU. No external API calls are required to match candidates.
*   **Singleton Pattern**: The transformer model is loaded once on startup, preventing cold starts and memory allocation overhead.
*   **Hybrid LLM Routing**: Generative endpoints use Gemini JSON schemas when an API key is available, falling back to deterministic templates when offline.

---

## 2. Tech Stack

### AI Engine (Python)

| Library | Version | Role |
| :--- | :--- | :--- |
| `fastapi` | $\ge$ 0.110.0 | High-performance ASGI framework. |
| `uvicorn` | $\ge$ 0.28.0 | Web server hosting. |
| `sentence-transformers` | $\ge$ 2.5.1 | Sentence vector representation. |
| `scikit-learn` | $\ge$ 1.4.0 | Pairwise cosine similarity calculation. |
| `numpy` | $\ge$ 1.26.0 | Fast array operations. |
| `pydantic` | $\ge$ 2.6.0 | Strict request/response schemas. |
| `cryptography` | $\ge$ 42.0.0 | Symmetric Fernet databases field encryption. |
| `passlib[bcrypt]` | $\ge$ 1.7.4 | BCrypt password hashing. |
| `PyJWT` | $\ge$ 2.8.0 | JSON Web Token validations. |

---

## 3. AI Engine — Python FastAPI Microservice

**Location:** `/ai-engine/`

### 3.1 Entry Point — `main.py`
Defines the main application loop, registers CORS middleware for Next.js, and maps sub-routers:
```python
app = FastAPI(title="HyperHire AI Engine", version="2.1.0")
# Routers registered:
app.include_router(matching_router, tags=["Matching"])
app.include_router(chat_router, tags=["Chat"])
app.include_router(workflow_router, tags=["Workflow"])
app.include_router(analytics_router, tags=["Analytics"])
app.include_router(trust_router, tags=["Trust"])
app.include_router(context_router, tags=["HyperAI Context Engine"])
app.include_router(optimization_router, tags=["HyperAI Optimization Engine"])
app.include_router(talent_router, tags=["HyperHire Talent Discovery"])
```

### 3.2 Model Loader — `model.py`
Implements a lazy-loaded singleton for the HuggingFace transformer:
```python
_model = None

def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model
```

### 3.3 Core Scoring Algorithm — `matcher.py`
Executes the multi-factor candidate ranking logic:
*   Extracts experience levels (`EXP_LEVEL_MAP = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}`).
*   Matches skills, experience levels, trust scores, and portfolio items.
*   Calculates a final match percentage using a weighted score formula.

### 3.4 Text Compilation Utilities — `utils.py`
Compiles structural JSON models into clean text strings for vector encoding:
*   `compile_job_text(job)`: Combines title, category, skills, and deliverables.
*   `compile_candidate_text(cand)`: Combines college, bio, and skills.
*   `compile_portfolio_text(port)`: Combines portfolio tags, description, and category.
*   `get_embeddings(texts)`: Returns a 384-dimensional list of floats representing the texts.

### 3.5 Pydantic Schemas — `schemas.py`
Exposes strict data types for client validation:
*   `JobModel`, `StudentProfileModel`, `PortfolioItemModel`.
*   `CandidateWithPortfolios`: Aggregates a profile and their portfolio items.
*   `MatchWeights`: Configures the weights used to calculate the overall match score.

### 3.6 Model Orchestrator & LLM Handler — `generation.py`
Manages model calls and structures responses:
*   `call_gemini_json()`: Calls the Gemini API, enforcing JSON schemas and currency constraints (INR, ₹).
*   `local_job_analysis()`: Provides deterministic skill and category parsing when offline.
*   `local_pitch_enhancement()`: Provides structured fallback templates for student applications.
*   `strip_styling_characters()`: Helper to remove markdown markers (`*`, `#`, etc.) from text fields, ensuring clean outputs.

### 3.7 Rule-Based Contextual Fallback — `chat_engine.py`
Maintains a fallback chat pipeline when the Gemini API is offline:
*   Evaluates active context elements (`activeJob`, `activeProfile`, etc.) using rule-based parsing.
*   Provides structured tips for profile optimization, portfolio updates, and application pitches.

---

## 4. API Routers Reference

### 4.1 Matching Router — `routes/matching.py`
*   `POST /embed`: Generates 384-dimensional vector arrays.
*   `POST /score`: Calculates a match score for a single candidate against a single job.
*   `POST /match`: Evaluates and ranks a list of candidates for a job.
*   `POST /recommend`: Evaluates and recommends a list of jobs for a candidate.
*   `POST /portfolio/summarize`: Generates a summary for a portfolio project.
*   `POST /application/enhance`: Optimizes cover messages based on application tone.
*   `POST /job/analyze`: Suggests categories, difficulty levels, and deliverables for new job posts.

### 4.2 Optimization Router — `routes/optimization.py`
*   `POST /optimization/proposal`: Reviews student pitches, scoring clarity, relevance, and professionalism.
*   `POST /optimization/gig`: Analyzes business postings for description length and budget limits.

### 4.3 Workforce Talent Discovery — `routes/talent.py`
*   `POST /talent/search`: Evaluates candidate pools against search queries, identifying risk profiles and talent rarities (e.g., "Full-Stack JS Specialist").

### 4.4 Reputation & Trust Tracker — `routes/trust.py`
*   `POST /trust/explain`: Generates behavioral insights, pointing out risks and growth opportunities for student profiles.

### 4.5 Workflow Coordinator — `routes/workflow.py`
*   `POST /workflow/analyze`: Evaluates task boards, flagging delays and inactivity issues.
*   `POST /workflow/suggest-tasks`: Generates a list of suggested tasks based on the job title.

### 4.6 HyperAI Chat Engine — `routes/chat.py`
*   `POST /chat`: Aggregates chat history and page contexts to generate custom assistant responses.

### 4.7 Ecosystem Context Analyzer — `routes/context.py`
*   `POST /hyperai/context`: Runs checks across the workspace, flagging risks and generating priority recommendations.

### 4.8 Semantic Analytics Heatmap — `routes/analytics.py`
*   `POST /analytics/market-heatmap`: Clusters skills using K-Means to identify high-demand zones.

---

## 5. Security & Protection Infrastructure

Located under `security/`, this layer guards the microservice from unauthorized access and attacks.

```
Incoming Request ──► [Rate Limiter] ──► [Auth Middleware] ──► [RBAC Guard] ──► Route Controller
```

### 5.1 Authentication & JWT Session — `security/auth.py`
*   Verifies JWT tokens. Parses `UserClaims` containing the user's role and email.
*   Handles password hashing and verification using `passlib.context.CryptContext`.

### 5.2 Role-Based Access Controls — `security/rbac.py`
*   Restricts routes by verifying user roles:
    ```python
    def require_role(allowed_role: UserRole):
        ...
    ```

### 5.3 Token Bucket Rate Limiter — `security/rate_limiter.py`
*   Implements a token bucket algorithm to throttle API requests.
*   Protects auth routes from brute-force login attempts.

### 5.4 Payload & File Upload Protection — `security/file_upload.py`
*   Restricts uploads to valid file types (PDF, PNG, JPG, MP4).
*   Enforces file size limits to prevent Denial-of-Service attacks.

### 5.5 Field-Level Database Encryption — `security/encryption.py`
*   Encrypts sensitive database fields (like bank accounts) using AES Fernet keys.

---

## 6. Frontend AI Integration — Next.js

The Next.js client interacts with the AI service using a typed service layer:
*   `src/services/ai/client.ts`: Handles requests and manages error fallbacks.
*   `src/services/ai/service.ts`: Exposes service methods (`matchCandidatesForJob()`, `chatWithAssistant()`, etc.).
*   `src/services/ai/types.ts`: TypeScript interfaces matching the Pydantic schemas.

---

## 7. UI Components

Located in `src/components/ai/`:
*   `StudentAIRecommendations.tsx`: Shows ranked jobs on the student dashboard.
*   `BusinessAIRecommendations.tsx`: Lists matching candidates inside the business drawer.
*   `AIMatchVisualization.tsx`: Renders a circular gauge showing the match breakdown.
*   `AIExplanationCard.tsx`: Displays the reasoning behind the matching score.
*   `AIInsightsWidget.tsx`: Suggests actions to optimize the user's profile.
*   `AISkeletonLoader.tsx`: Renders a pulsing loading placeholder.

---

## 8. The Matching Algorithm — Deep Dive

The matching score is computed in `matcher.py` using a weighted formula:

$$\text{Final Score} = \sum_{i=1}^{n} w_i S_i$$

### Factor Weights:
$$\begin{aligned}
w_{\text{semantic}} &= 0.30 \\
w_{\text{skills}} &= 0.20 \\
w_{\text{trust}} &= 0.15 \\
w_{\text{experience}} &= 0.10 \\
w_{\text{portfolio}} &= 0.15 \\
w_{\text{category}} &= 0.10
\end{aligned}$$

---

## 9. API Endpoints Reference Table

| Method | Endpoint | Payload Schema | Service Component |
| :--- | :--- | :--- | :--- |
| `POST` | `/embed` | `EmbedRequest` | Vectorizer utilities. |
| `POST` | `/score` | `ScoreRequest` | 1:1 Candidate-Job matching. |
| `POST` | `/match` | `MatchRequest` | Multi-candidate ranking. |
| `POST` | `/recommend` | `RecommendRequest` | Personalized job recommendations. |
| `POST` | `/portfolio/summarize` | `PortfolioSummarizeRequest` | Portfolio summarizer. |
| `POST` | `/application/enhance` | `ApplicationEnhanceRequest` | Smart Pitch Assistant. |
| `POST` | `/job/analyze` | `JobAnalyzeRequest` | AI Job Planner. |
| `POST` | `/optimization/proposal` | `ProposalOptimizationPayload` | Pitch optimizer. |
| `POST` | `/optimization/gig` | `GigOptimizationPayload` | Job post optimizer. |
| `POST` | `/talent/search` | `TalentSearchRequest` | Semantic search engine. |
| `POST` | `/trust/explain` | `TrustProfileRequest` | Reputation tracker. |
| `POST` | `/workflow/analyze` | `WorkflowAnalyzeRequest` | Workflow risk detector. |
| `POST` | `/workflow/suggest-tasks` | `WorkflowSuggestRequest` | Workflow task builder. |
| `POST` | `/chat` | `ChatRequest` | Contextual chat assistant. |
| `POST` | `/hyperai/context` | `PlatformSignalPayload` | Context aggregator. |
| `POST` | `/analytics/market-heatmap` | `HeatmapRequest` | Skill demand analyzer. |
| `POST` | `/register` | `RegisterRequest` | Auth registration. |
| `POST` | `/login` | `LoginRequest` | Session login. |

---

## 10. Ecosystem Data Flows

```
[Business creates post] ──► POST /job/analyze ──► Suggested categories & deliverables
                                                        │
[Student views dashboard] ◄── POST /recommend ◄─────────┘
        │
[Student creates pitch] ──► POST /optimization/proposal ──► Suggest changes & tone adjustments
        │
[Student submits pitch] ──► POST /match ──► Rank candidates for business review
        │
[Collaboration kicks off] ──► POST /workflow/analyze ──► Track task progress and status changes
        │
[Milestone approved] ──► POST /trust/explain ──► Update user trust score
```

---

## 11. Environment & Deployment Setup

### Variables Configuration (`.env.local`)
```env
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8000
```

### Local Dev Setup
```powershell
cd ai-engine
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The Swagger UI docs are available locally at: `http://localhost:8000/docs`
