from fastapi import APIRouter
from ..services.weather_service import get_forecast, get_weather

router = APIRouter() # This is what main.py is looking for!

@router.get("/current")

async def current_weather(city: str):
    return await get_weather(city)

@router.get("/forecast") # The route stays here!
async def forecast_weather(city: str):
    
    return await get_forecast(city)