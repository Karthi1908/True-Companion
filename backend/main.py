import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agents import run_wellness_flow, sentiment_agent, hitl_agent, main_agent
import opik
from opik.integrations.adk import OpikTracer, track_adk_agent_recursive
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Mental Wellness Agent API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Opik tracking
try:
    tracer = OpikTracer()
    track_adk_agent_recursive(sentiment_agent, tracer)
    track_adk_agent_recursive(hitl_agent, tracer)
    track_adk_agent_recursive(main_agent, tracer)
    print("Opik tracking initialized for all agents.")
except Exception as e:
    print(f"Failed to initialize Opik tracking: {e}")

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"

class ChatResponse(BaseModel):
    response: str
    sentiment: str
    safety: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = await run_wellness_flow(request.message, request.session_id)
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
