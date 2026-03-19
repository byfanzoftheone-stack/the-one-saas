from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import jwt

app = FastAPI()

SECRET = "CHANGE_ME_SECRET"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fake_users = {}

class User(BaseModel):
    email: str
    password: str

def create_token(email):
    return jwt.encode({"sub": email}, SECRET, algorithm="HS256")

def get_user(token: str):
    try:
        data = jwt.decode(token, SECRET, algorithms=["HS256"])
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
