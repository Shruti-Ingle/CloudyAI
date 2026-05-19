from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, generate, analyse, user
from app import config

app = FastAPI(title="CloudyAI Backend")

# Setup CORS to allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(generate.router, prefix="/generate", tags=["Architecture Generation"])
app.include_router(analyse.router, prefix="/analyse", tags=["Architecture Analysis"])
app.include_router(user.router, prefix="/user", tags=["User Profile"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "CloudyAI API is running"}
