import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()

# Enable CORS so your Frontend can talk to this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = "YOUR_OPENWEATHER_API_KEY"

@app.get("/forecast/{city}")
def get_7_day_forecast(city: str):
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()

    if response.status_code != 200:
        return {"error": "City not found"}

    # Filter to get one forecast per day like picking 12:00 PM
    daily_data = []
    for entry in data['list']:
        if "12:00:00" in entry['dt_txt']:
            daily_data.append({
                "date": entry['dt_txt'].split(" ")[0],
                "temp": round(entry['main']['temp']),
                "description": entry['weather'][0]['description'],
                "icon": entry['weather'][0]['icon']
            })

    return {"city": data['city']['name'], "forecast": daily_data}

@app.get("/api/weather/forecast")
def get_7_day_forecast(city: str):
    # Use your API Key here
    api_key = "32ad0c24f1a7e51ba7dc0526302eb80b"
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric"
    
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "City not found"}, 404
        
    data = response.json()
    # Filters to 1 forecast per day (the 12:00 PM slot)
    daily_forecasts = [item for item in data['list'] if "12:00:00" in item['dt_txt']]
    
    return {"city": data['city']['name'], "forecast": daily_forecasts}