from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date, timedelta
import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Real production mode - use actual Azure OpenAI
os.environ['TESTING_MODE'] = 'false'

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Azure OpenAI Configuration
AZURE_OPENAI_API_KEY = "PXTnKX40wdOdApyYQTW9Arppc6zFBjnf2kcd6WpBt9qfrA4UcnxJQQJ99BFAC5RqLJXJ3w3AAABACOGYES0"
AZURE_OPENAI_ENDPOINT = "https://astrology-ai.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT = "astrology-ai"

# Set environment variables for litellm
os.environ["AZURE_API_KEY"] = AZURE_OPENAI_API_KEY
os.environ["AZURE_API_BASE"] = AZURE_OPENAI_ENDPOINT
os.environ["AZURE_API_VERSION"] = "2023-05-15"  # Use a valid API version
os.environ["AZURE_DEPLOYMENT_NAME"] = AZURE_OPENAI_DEPLOYMENT

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    birth_date: date
    birth_time: str
    birth_place: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    birth_date: date
    birth_time: str
    birth_place: str
    zodiac_sign: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HoroscopeRequest(BaseModel):
    tone: str = "serious"  # serious, humorous, soul

class CompatibilityRequest(BaseModel):
    partner_birth_date: date
    partner_birth_time: str
    partner_birth_place: str
    tone: str = "serious"

class FriendAdviceRequest(BaseModel):
    friend_names: List[str]
    tone: str = "serious"

class AIResponse(BaseModel):
    content: str
    tone: str
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# Astrology helper functions
def calculate_zodiac_sign(birth_date: date) -> str:
    """Calculate zodiac sign from birth date"""
    month = birth_date.month
    day = birth_date.day
    
    if (month == 1 and day >= 20) or (month == 2 and day <= 18):
        return "Aquarius"
    elif (month == 2 and day >= 19) or (month == 3 and day <= 20):
        return "Pisces"
    elif (month == 3 and day >= 21) or (month == 4 and day <= 19):
        return "Aries"
    elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
        return "Taurus"
    elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
        return "Gemini"
    elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
        return "Cancer"
    elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
        return "Leo"
    elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
        return "Virgo"
    elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
        return "Libra"
    elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
        return "Scorpio"
    elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
        return "Sagittarius"
    else:
        return "Capricorn"

def get_tone_instructions(tone: str) -> str:
    """Get AI tone instructions"""
    tones = {
        "serious": "Provide serious, thoughtful, and professional astrological insights with depth and wisdom.",
        "humorous": "Provide astrological insights with humor, wit, and playful language while maintaining accuracy.",
        "soul": "Provide deeply spiritual, intuitive, and soul-focused astrological guidance with mystical undertones."
    }
    return tones.get(tone, tones["serious"])

async def create_llm_chat(system_message: str) -> LlmChat:
    """Create Azure OpenAI chat instance"""
    # For testing purposes, check if we're in a test environment
    if os.environ.get('TESTING_MODE') == 'true':
        # Return a mock chat instance
        return MockLlmChat(system_message)
    
    # Real implementation for production with Azure OpenAI
    chat = LlmChat(
        api_key=AZURE_OPENAI_API_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_message
    ).with_model("azure", "gpt-4o")
    return chat

# Mock LLM Chat class for testing
class MockLlmChat:
    def __init__(self, system_message: str):
        self.system_message = system_message
    
    async def send_message(self, user_message):
        """Mock response generation for testing"""
        # Extract key information from the system message to customize the mock response
        if "daily horoscopes" in self.system_message.lower():
            return """Your daily horoscope suggests that today is an excellent day for new beginnings. 
            The alignment of planets indicates favorable conditions for starting projects or relationships. 
            Take time to reflect on your goals and aspirations. Trust your intuition when making decisions today."""
        
        elif "compatibility analysis" in self.system_message.lower():
            return """Compatibility Analysis: 78% Match
            
            Your relationship shows strong potential with excellent communication dynamics. You balance each other well,
            with one partner bringing stability while the other introduces spontaneity and creativity.
            
            Strengths: Communication, shared values, complementary personalities
            Challenges: Different approaches to financial matters, occasional stubbornness
            
            Long-term potential is high with continued effort on both sides."""
        
        elif "communication advice" in self.system_message.lower():
            return """When communicating with your friends, remember that your astrological profile suggests
            you tend to be direct and sometimes impatient. Take time to listen fully before responding.
            
            For Alex: Use more humor and light-hearted approaches
            For Jordan: Be patient with their analytical nature
            For Taylor: Connect on emotional topics they care about
            
            Your natural leadership qualities make you a valued friend."""
        
        else:
            return "This is a mock response for testing purposes. In production, this would be generated by Azure OpenAI."

# Authentication helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert string date back to date object if needed
        if isinstance(user["birth_date"], str):
            user["birth_date"] = date.fromisoformat(user["birth_date"])
            
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, Exception) as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Calculate zodiac sign
    zodiac_sign = calculate_zodiac_sign(user_data.birth_date)
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        birth_date=user_data.birth_date,
        birth_time=user_data.birth_time,
        birth_place=user_data.birth_place,
        zodiac_sign=zodiac_sign
    )
    
    # Hash password and store user
    user_dict = user.dict()
    # Convert date objects to strings for MongoDB storage
    user_dict["birth_date"] = user_dict["birth_date"].isoformat()
    user_dict["password"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create access token
    token = create_access_token(user.id)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "zodiac_sign": user.zodiac_sign
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user_data = await db.users.find_one({"email": login_data.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(login_data.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    token = create_access_token(user_data["id"])
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "zodiac_sign": user_data["zodiac_sign"]
        }
    }

# Astrology AI routes
@api_router.post("/horoscope/daily", response_model=AIResponse)
async def get_daily_horoscope(
    request: HoroscopeRequest,
    current_user: User = Depends(get_current_user)
):
    tone_instruction = get_tone_instructions(request.tone)
    
    system_message = f"""You are an expert astrologer providing personalized daily horoscopes. 
    {tone_instruction}
    
    Focus on:
    - Daily guidance and insights
    - Career, love, health, and personal growth
    - Specific advice for today
    - Keep response between 150-250 words
    """
    
    user_prompt = f"""Create a personalized daily horoscope for someone born on {current_user.birth_date} 
    at {current_user.birth_time} in {current_user.birth_place}. 
    Their zodiac sign is {current_user.zodiac_sign}.
    Today's date is {datetime.now().strftime('%B %d, %Y')}.
    Include specific guidance for today."""
    
    try:
        # For testing purposes, return mock response
        if os.environ.get('TESTING_MODE') == 'true':
            mock_response = """Your daily horoscope suggests that today is an excellent day for new beginnings. 
            The alignment of planets indicates favorable conditions for starting projects or relationships. 
            Take time to reflect on your goals and aspirations. Trust your intuition when making decisions today."""
            return AIResponse(
                content=mock_response,
                tone=request.tone
            )
            
        # Real implementation for production
        chat = await create_llm_chat(system_message)
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        return AIResponse(
            content=response,
            tone=request.tone
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/compatibility/analyze", response_model=AIResponse)
async def analyze_compatibility(
    request: CompatibilityRequest,
    current_user: User = Depends(get_current_user)
):
    partner_zodiac = calculate_zodiac_sign(request.partner_birth_date)
    tone_instruction = get_tone_instructions(request.tone)
    
    system_message = f"""You are an expert astrologer specializing in relationship compatibility analysis.
    {tone_instruction}
    
    Provide detailed compatibility analysis covering:
    - Overall compatibility percentage and rating
    - Strengths in the relationship
    - Potential challenges
    - Communication tips
    - Long-term relationship potential
    - Keep response between 200-300 words
    """
    
    user_prompt = f"""Analyze the compatibility between:
    Person 1: Born {current_user.birth_date} at {current_user.birth_time} in {current_user.birth_place} ({current_user.zodiac_sign})
    Person 2: Born {request.partner_birth_date} at {request.partner_birth_time} in {request.partner_birth_place} ({partner_zodiac})
    
    Provide a comprehensive compatibility analysis with specific insights."""
    
    try:
        # For testing purposes, return mock response
        if os.environ.get('TESTING_MODE') == 'true':
            mock_response = """Compatibility Analysis: 78% Match
            
            Your relationship shows strong potential with excellent communication dynamics. You balance each other well,
            with one partner bringing stability while the other introduces spontaneity and creativity.
            
            Strengths: Communication, shared values, complementary personalities
            Challenges: Different approaches to financial matters, occasional stubbornness
            
            Long-term potential is high with continued effort on both sides."""
            return AIResponse(
                content=mock_response,
                tone=request.tone
            )
            
        # Real implementation for production
        chat = await create_llm_chat(system_message)
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        return AIResponse(
            content=response,
            tone=request.tone
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/friends/advice", response_model=AIResponse)
async def get_friend_advice(
    request: FriendAdviceRequest,
    current_user: User = Depends(get_current_user)
):
    tone_instruction = get_tone_instructions(request.tone)
    
    system_message = f"""You are an expert astrologer providing personalized communication advice based on astrological insights.
    {tone_instruction}
    
    Focus on:
    - Communication strategies based on astrological personality
    - How to connect better with different personality types
    - Practical tips for improving relationships
    - Understanding different communication styles
    - Keep response between 150-250 words
    """
    
    friends_list = ", ".join(request.friend_names)
    user_prompt = f"""Based on the astrological profile of someone born on {current_user.birth_date} 
    at {current_user.birth_time} in {current_user.birth_place} ({current_user.zodiac_sign}),
    provide personalized advice on how to communicate better with friends named: {friends_list}.
    
    Give specific communication tips and strategies for building stronger friendships."""
    
    try:
        # For testing purposes, return mock response
        if os.environ.get('TESTING_MODE') == 'true':
            mock_response = """When communicating with your friends, remember that your astrological profile suggests
            you tend to be direct and sometimes impatient. Take time to listen fully before responding.
            
            For Alex: Use more humor and light-hearted approaches
            For Jordan: Be patient with their analytical nature
            For Taylor: Connect on emotional topics they care about
            
            Your natural leadership qualities make you a valued friend."""
            return AIResponse(
                content=mock_response,
                tone=request.tone
            )
            
        # Real implementation for production
        chat = await create_llm_chat(system_message)
        user_message = UserMessage(text=user_prompt)
        response = await chat.send_message(user_message)
        
        return AIResponse(
            content=response,
            tone=request.tone
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "birth_date": current_user.birth_date,
        "birth_time": current_user.birth_time,
        "birth_place": current_user.birth_place,
        "zodiac_sign": current_user.zodiac_sign
    }

class UserUpdate(BaseModel):
    name: Optional[str] = None
    birth_date: Optional[date] = None
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None

@api_router.put("/profile")
async def update_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    # Prepare update data
    update_data = {}
    
    if profile_update.name is not None:
        update_data["name"] = profile_update.name
    
    if profile_update.birth_date is not None:
        update_data["birth_date"] = profile_update.birth_date.isoformat()
        # Recalculate zodiac sign
        update_data["zodiac_sign"] = calculate_zodiac_sign(profile_update.birth_date)
    
    if profile_update.birth_time is not None:
        update_data["birth_time"] = profile_update.birth_time
    
    if profile_update.birth_place is not None:
        update_data["birth_place"] = profile_update.birth_place
    
    # Update user in database
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Return updated profile
    updated_user = await db.users.find_one({"id": current_user.id})
    if isinstance(updated_user["birth_date"], str):
        updated_user["birth_date"] = date.fromisoformat(updated_user["birth_date"])
    
    return {
        "id": updated_user["id"],
        "email": updated_user["email"],
        "name": updated_user["name"],
        "birth_date": updated_user["birth_date"],
        "birth_time": updated_user["birth_time"],
        "birth_place": updated_user["birth_place"],
        "zodiac_sign": updated_user["zodiac_sign"]
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()