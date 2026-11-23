import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt

app = FastAPI()

_DEFAULT_SECRET = "CHANGE_ME_SECRET"
SECRET_KEY = os.environ.get("SECRET_KEY", _DEFAULT_SECRET)
# Production = a real deploy (Railway sets RAILWAY_ENVIRONMENT) or an explicit ENV/APP_ENV=production.
IS_PRODUCTION = (
    os.environ.get("ENV", os.environ.get("APP_ENV", "")).lower() == "production"
    or bool(os.environ.get("RAILWAY_ENVIRONMENT"))
)
if IS_PRODUCTION and SECRET_KEY in ("", _DEFAULT_SECRET, "CHANGE_ME_LONG_RANDOM"):
    raise RuntimeError("SECRET_KEY must be set to a real secret in production (default refused)")

# Explicit allowlist only. Empty/unset => no cross-origin access; "*" is refused.
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip() and o.strip() != "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fake_users = {}

class User(BaseModel):
    email: str
    password: str

def create_token(email):
    return jwt.encode({"sub": email}, SECRET_KEY, algorithm="HS256")

def get_user(token: str):
    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data["sub"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/register")
def register(user: User):
    if user.email in fake_users:
        raise HTTPException(400, "User exists")
    fake_users[user.email] = user.password
    return {"msg": "registered"}

@app.post("/api/auth/login")
def login(user: User):
    if fake_users.get(user.email) != user.password:
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user.email)
    return {"token": token}

@app.get("/api/modules")
def modules():
    return {"modules":[{"name":"The One Crew","price":49,"installed":False}]}

@app.post("/api/execute")
def execute(token: str):
    user = get_user(token)
    return {"user": user, "result":"AI executed"}
