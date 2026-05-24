from fastapi import (
    FastAPI,
    HTTPException,
    Depends
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from routes.matching import (
    router as matching_router
)

from routes.chat import (
    router as chat_router
)

from routes.workflow import (
    router as workflow_router
)

from model import get_model

from security.auth import (
    create_access_token,
    hash_password,
    verify_password,
    get_current_user,
    UserClaims,
)

from security.rbac import (
    require_role,
    UserRole
)

import logging


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger(__name__)


app = FastAPI(
    title="HyperHire AI Engine",
    description="Dedicated FastAPI microservice for AI matching and Workflow Intelligence.",
    version="2.1.0"
)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# DUMMY DATABASE
# =========================

fake_users_db = {}


# =========================
# REQUEST MODELS
# =========================

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "student"


class LoginRequest(BaseModel):
    email: str
    password: str


# =========================
# STARTUP
# =========================

@app.on_event("startup")
def startup_event():

    logger.info(
        "Starting HyperHire AI Engine..."
    )

    try:
        get_model()

        logger.info(
            "Model loaded successfully."
        )

    except Exception as e:
        logger.error(
            f"Model loading failed: {e}"
        )


# =========================
# ROOT
# =========================

@app.get("/")
def read_root():

    return {
        "status": "online",
        "service": "HyperHire AI Engine",
        "model": "all-MiniLM-L6-v2"
    }


# =========================
# REGISTER
# =========================

@app.post("/register")
async def register(
    data: RegisterRequest
):

    if data.email in fake_users_db:

        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    hashed = hash_password(
        data.password
    )

    fake_users_db[data.email] = {
        "email": data.email,
        "password": hashed,
        "role": data.role
    }

    return {
        "message": "User registered successfully"
    }


# =========================
# LOGIN
# =========================

@app.post("/login")
async def login(
    data: LoginRequest
):

    user = fake_users_db.get(
        data.email
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        data.password,
        user["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token({

        "sub": data.email,
        "email": data.email,
        "role": user["role"]

    })

    return {
        "access_token": token,
        "token_type": "bearer"
    }


# =========================
# PROTECTED ROUTE
# =========================

@app.get("/protected")
async def protected_route(
    current_user: UserClaims = Depends(
        get_current_user
    )
):

    return {
        "message": "Protected route working",
        "user": current_user.email,
        "role": current_user.role
    }


# =========================
# ADMIN ROUTE
# =========================

@app.get("/admin")
async def admin_route(
    current_user: UserClaims = Depends(
        require_role(UserRole.ADMIN)
    )
):

    return {
        "message": "Admin access granted"
    }


# =========================
# ROUTERS
# =========================

app.include_router(
    matching_router,
    tags=["Matching"]
)

app.include_router(
    chat_router,
    tags=["Chat"]
)

app.include_router(
    workflow_router,
    tags=["Workflow"]
)