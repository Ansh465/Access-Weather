import os
import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter()

API_KEY = os.getenv("OPENWEATHER_API_KEY")
GEO_URL = "http://api.openweathermap.org/geo/1.0/direct"

@router.get("/search")
async def search_city(q: str):
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

    # 1. Call OpenWeather Geocoding API
    # limit=5 gives the user options (e.g., London, UK vs London, Canada)
    url = f"{GEO_URL}?q={q}&limit=5&appid={API_KEY}"

    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url)
            if res.status_code != 200:
                raise HTTPException(status_code=500, detail="Geocoding API failed")
            
            data = res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    # 2. Format the response for your Frontend
    results = []
    for item in data:
        results.append({
            "name": item.get("name"),
            "lat": item.get("lat"),
            "lon": item.get("lon"),
            "country": item.get("country"),
            "state": item.get("state", ""),  # State is optional
            "display_name": f"{item.get('name')}, {item.get('state', '')} {item.get('country')}".replace(" ,", ",")
        })

    return results