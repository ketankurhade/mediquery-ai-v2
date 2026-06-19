from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, reports, chat

app = FastAPI(title="MediQuery AI API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(chat.router)

@app.get("/")
def root():
    return {"message": "MediQuery AI API is running", "version": "2.0"}