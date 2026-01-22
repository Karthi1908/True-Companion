import os
from typing import Dict, Any
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk import Runner
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Configuration for Gemini
MODEL_NAME = "gemini-2.0-flash"

# Session service for agents
session_service = InMemorySessionService()

def get_text(event) -> str:
    """Helper to extract text from an ADK event."""
    if event and event.content and event.content.parts:
        return "".join(part.text for part in event.content.parts if part.text)
    return ""

async def get_agent_response(agent: LlmAgent, message: str, session_id: str = "default") -> str:
    """Convenience helper to run an agent and get the final text."""
    user_id = "user"
    app_name = "MentalWellnessApp"
    
    # Ensure session exists
    session = await session_service.get_session(app_name=app_name, user_id=user_id, session_id=session_id)
    if session is None:
        await session_service.create_session(app_name=app_name, user_id=user_id, session_id=session_id)
        
    runner = Runner(agent=agent, app_name=app_name, session_service=session_service)
    final_text = ""
    async for event in runner.run_async(
        user_id="user",
        session_id=session_id,
        new_message=types.Content(parts=[types.Part(text=message)]),
    ):
        if event.content and event.content.parts:
            text = get_text(event)
            if text:
                final_text = text
    return final_text

sentiment_agent = LlmAgent(
    name="SentimentAgent",
    model=MODEL_NAME,
    instruction="""
    You are a sentiment analysis expert for a mental wellness app. 
    Analyze the user's message and identify the primary emotion and the suggested tone for the response.
    Return your analysis in the following format:
    Emotion: [Primary Emotion]
    Suggested Tone: [Compassionate/Reassuring/Firm/etc.]
    """,
)

hitl_agent = LlmAgent(
    name="HITLAgent",
    model=MODEL_NAME,
    instruction="""
    You are a safety monitor for a mental wellness app. 
    Your job is to detect if the user is in immediate danger (suicidal thoughts, self-harm, severe crisis).
    If the user is in danger, respond with "ESCALATE: TRUE". 
    Otherwise, respond with "ESCALATE: FALSE".
    """,
)

main_agent = LlmAgent(
    name="MainWellnessAgent",
    model=MODEL_NAME,
    instruction="""
    You are a compassionate mental wellness AI agent. 
    Your goal is to listen to people in vulnerable states and provide empathetic advice.
    You will receive the user's message along with sentiment analysis and safety status.
    If safety status is "ESCALATE: TRUE", focus on providing immediate crisis resources and tell them a human is being notified.
    Always be supportive, non-judgmental, and helpful.
    """,
)

async def run_wellness_flow(user_input: str, session_id: str = "default"):
    # 1. Analyze Sentiment
    sentiment_text = await get_agent_response(sentiment_agent, user_input, f"{session_id}_sentiment")
    
    # 2. Check for safety
    safety_text = await get_agent_response(hitl_agent, user_input, f"{session_id}_safety")
    
    # 3. Formulate response
    context = f"User Message: {user_input}\nSentiment Analysis: {sentiment_text}\nSafety Status: {safety_text}"
    final_response_text = await get_agent_response(main_agent, context, session_id)
    
    return {
        "response": final_response_text,
        "sentiment": sentiment_text,
        "safety": safety_text
    }
