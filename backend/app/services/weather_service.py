import os
import httpx
from fastapi import HTTPException
from app.utils.cache import get_cached, set_cache

# 1. Configuration
API_KEY = os.getenv("OPENWEATHER_API_KEY")
BASE_URL = "https://api.openweathermap.org/data/2.5"

# 2. Main Entry Points (Called by routes)
async def get_weather(city: str):
    """Primary function for current weather with caching logic"""
    clean_city = city.strip().lower()

    # Check cache first
    cached = get_cached(clean_city)
    if cached:
        return cached

    # If no cache, fetch from API
    return await fetch_current_weather(clean_city)

async def get_forecast(city: str):
    """Primary function for forecast"""
    return await fetch_forecast(city)

# 3. Helper Logic
async def fetch_current_weather(city: str):
    url = f"{BASE_URL}/weather?q={city},GB&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code == 404:
            raise HTTPException(status_code=404, detail="City not found")
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Weather API failed")

        data = res.json()

    formatted = format_weather(data)
    
    # Save to Supabase cache
    set_cache(city, formatted)
    
    return formatted

def format_weather(data):
    return {
        "city": data["name"],
        "temperature": data["main"]["temp"],
        "description": data["weather"][0]["description"],
        "humidity": data["main"]["humidity"],
        "wind": data["wind"]["speed"]
    }

async def fetch_forecast(city: str):
    clean_city = city.strip().lower()
    url = f"{BASE_URL}/forecast?q={clean_city},GB&appid={API_KEY}&units=metric"

    async with httpx.AsyncClient() as client:
        res = await client.get(url)
        if res.status_code != 200:
            raise HTTPException(status_code=500, detail="Forecast API failed")
        data = res.json()

    return format_forecast(data)

def format_forecast(data):
    forecast_list = data["list"]
    hourly = []
    daily = {}

    for item in forecast_list:
        dt = item["dt_txt"]
        entry = {
            "time": dt,
            "temp": item["main"]["temp"],
            "description": item["weather"][0]["description"]
        }

        if len(hourly) < 8:
            hourly.append(entry)

        date = dt.split(" ")[0]
        if date not in daily:
            daily[date] = {"temps": [], "descriptions": []}
        daily[date]["temps"].append(item["main"]["temp"])
        daily[date]["descriptions"].append(item["weather"][0]["description"])

    daily_forecast = []
    for date, values in daily.items():
        daily_forecast.append({
            "date": date,
            "min": min(values["temps"]),
            "max": max(values["temps"]),
            "description": values["descriptions"][0]
        } )

    return {
        "hourly": hourly,
        "daily": daily_forecast[:7]
    }