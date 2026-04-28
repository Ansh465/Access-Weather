import requests
from fastapi import FastAPI, Query
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

import os

API_KEY = os.getenv("OPENWEATHER_API_KEY", "")

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

@app.get("/geocode")
def proxy_geocode(address: str):
    geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={address}&limit=1&appid={API_KEY}"
    res = requests.get(geo_url)
    if res.status_code != 200 or not res.json():
        return {"results": [], "status": "ZERO_RESULTS"}
    
    geo_data = res.json()[0]
    lat = geo_data.get("lat")
    lng = geo_data.get("lon")
    
    return {
        "results": [
            {
                "geometry": {
                    "location": {
                        "lat": lat,
                        "lng": lng
                    }
                }
            }
        ],
        "status": "OK"
    }

@app.post("/api/airquality")
def proxy_air_quality(location: dict):
    lat = location.get("location", {}).get("latitude")
    lng = location.get("location", {}).get("longitude")
    
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lng}&appid={API_KEY}"
    res = requests.get(url)
    if res.status_code != 200:
        return {"indexes": [{"aqi": 50, "aqiDisplay": "50", "category": "Good", "dominantPollutant": "pm25"}]}
        
    data = res.json()
    list_data = data.get("list", [])
    if not list_data:
        return {"indexes": [{"aqi": 50, "aqiDisplay": "50", "category": "Good", "dominantPollutant": "pm25"}]}
        
    ow_aqi = list_data[0].get("main", {}).get("aqi", 1)
    categories = {1: "Good", 2: "Fair", 3: "Moderate", 4: "Poor", 5: "Very Poor"}
    aqi_vals = {1: 25, 2: 50, 3: 75, 4: 100, 5: 150}
    
    cat = categories.get(ow_aqi, "Good")
    val = aqi_vals.get(ow_aqi, 50)
    
    return {
        "indexes": [
            {
                "aqi": val,
                "aqiDisplay": str(val),
                "category": cat,
                "dominantPollutant": "pm2.5"
            }
        ]
    }

@app.get("/api/autocomplete")
def autocomplete_city(q: str = Query(...)):
    if not q or len(q) < 2:
        return []
        
    url = f"http://api.openweathermap.org/geo/1.0/direct?q={q}&limit=5&appid={API_KEY}"
    res = requests.get(url)
    if res.status_code != 200:
        return []
        
    suggestions = []
    for item in res.json():
        name = item.get("name")
        country = item.get("country")
        state = item.get("state")
        
        display = f"{name}, {country}"
        if state:
            display = f"{name}, {state}, {country}"
            
        suggestions.append(display)
        
    return suggestions

@app.get("/v1/currentConditions:lookup")
def proxy_current_weather(latitude: float = Query(..., alias="location.latitude"), longitude: float = Query(..., alias="location.longitude")):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={API_KEY}&units=metric"
    res = requests.get(url)
    if res.status_code != 200:
        return {"error": "OpenWeather request failed"}
    
    data = res.json()
    weather_main = data["weather"][0]["main"].upper()
    w_type = "CLOUDY"
    if "CLEAR" in weather_main:
        w_type = "CLEAR"
    elif "RAIN" in weather_main or "DRIZZLE" in weather_main:
        w_type = "RAIN"
    elif "THUNDERSTORM" in weather_main:
        w_type = "STORM"
    elif "SNOW" in weather_main:
        w_type = "SNOW"

    return {
        "temperature": { "degrees": round(data["main"]["temp"]) },
        "feelsLikeTemperature": { "degrees": round(data["main"].get("feels_like", data["main"]["temp"])) },
        "weatherCondition": { 
            "description": { "text": data["weather"][0]["description"] }, 
            "type": w_type 
        },
        "uvIndex": 3,
        "relativeHumidity": data["main"]["humidity"],
        "dewPoint": { "degrees": round(data["main"]["temp"] - ((100 - data["main"]["humidity"]) / 5)) },
        "wind": { 
            "speed": { "value": round(data["wind"]["speed"] * 3.6) },
            "gust": { "value": round(data.get("wind", {}).get("gust", 0) * 3.6) }, 
            "direction": { "cardinal": "NORTH" } 
        },
        "visibility": { "distance": round(data.get("visibility", 10000) / 1000) },
        "precipitation": { "qpf": { "quantity": data.get("rain", {}).get("1h", 0.0) } }
    }

@app.get("/v1/forecast/hours:lookup")
def proxy_hourly_forecast(latitude: float = Query(..., alias="location.latitude"), longitude: float = Query(..., alias="location.longitude"), hours: int = 24):
    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&appid={API_KEY}&units=metric"
    res = requests.get(url)
    if res.status_code != 200:
        return {"error": "OpenWeather request failed"}
    
    data = res.json()
    forecast_hours = []
    for entry in data["list"][:8]:
        dt_txt = entry["dt_txt"]
        hour_part = int(dt_txt.split(" ")[1].split(":")[0])
        
        weather_main = entry["weather"][0]["main"].upper()
        w_type = "CLOUDY"
        if "CLEAR" in weather_main:
            w_type = "CLEAR"
        elif "RAIN" in weather_main or "DRIZZLE" in weather_main:
            w_type = "RAIN"
        elif "THUNDERSTORM" in weather_main:
            w_type = "STORM"
        elif "SNOW" in weather_main:
            w_type = "SNOW"

        forecast_hours.append({
            "displayDateTime": { "hours": hour_part },
            "temperature": { "degrees": round(entry["main"]["temp"]) },
            "precipitation": { "probability": { "percent": round(entry.get("pop", 0) * 100) } },
            "weatherCondition": { "type": w_type }
        })
        
    return { "forecastHours": forecast_hours }

@app.get("/v1/forecast/days:lookup")
def proxy_daily_forecast(latitude: float = Query(..., alias="location.latitude"), longitude: float = Query(..., alias="location.longitude"), days: int = 7):
    url = f"http://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&appid={API_KEY}&units=metric"
    res = requests.get(url)
    if res.status_code != 200:
        return {"error": "OpenWeather request failed"}
    
    data = res.json()
    daily_groups = {}
    for entry in data["list"]:
        date_str = entry["dt_txt"].split(" ")[0]
        if date_str not in daily_groups:
            daily_groups[date_str] = []
        daily_groups[date_str].append(entry)
    
    forecast_days = []
    for date_str, entries in daily_groups.items():
        temps = [e["main"]["temp"] for e in entries]
        min_temp = min(temps)
        max_temp = max(temps)
        
        mid_entry = entries[len(entries) // 2]
        weather_main = mid_entry["weather"][0]["main"].upper()
        w_type = "CLOUDY"
        if "CLEAR" in weather_main:
            w_type = "CLEAR"
        elif "RAIN" in weather_main or "DRIZZLE" in weather_main:
            w_type = "RAIN"
        elif "THUNDERSTORM" in weather_main:
            w_type = "STORM"
        elif "SNOW" in weather_main:
            w_type = "SNOW"
            
        year, month, day = map(int, date_str.split("-"))
        
        forecast_days.append({
            "displayDate": { "year": year, "month": month, "day": day },
            "minTemperature": { "degrees": round(min_temp) },
            "maxTemperature": { "degrees": round(max_temp) },
            "weatherCondition": { "type": w_type },
            "sunEvents": { "sunriseTime": f"{date_str}T06:00:00Z", "sunsetTime": f"{date_str}T20:00:00Z" }
        })
        
    return { "forecastDays": forecast_days, "timeZone": { "id": "Europe/London" } }

@app.get("/geocode/reverse")
def proxy_reverse_geocode(latitude: float, longitude: float):
    reverse_url = f"http://api.openweathermap.org/geo/1.0/reverse?lat={latitude}&lon={longitude}&limit=1&appid={API_KEY}"
    res = requests.get(reverse_url)
    if res.status_code != 200 or not res.json():
        return {"results": [], "status": "ZERO_RESULTS"}
    
    geo_data = res.json()[0]
    name = geo_data.get("name", "London")
    country = geo_data.get("country", "GB")
    
    return {
        "results": [
            {
                "formatted_address": f"{name}, {country}",
                "address_components": [
                    { "types": ["locality"], "long_name": name },
                    { "types": ["administrative_area_level_1"], "short_name": country, "long_name": country }
                ]
            }
        ],
        "status": "OK"
    }

@app.get("/api/weather/forecast")
def get_7_day_forecast(city: str):
    api_key = "32ad0c24f1a7e51ba7dc0526302eb80b"
    url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric"
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "City not found"}, 404
    data = response.json()
    daily_forecasts = [item for item in data['list'] if "12:00:00" in item['dt_txt']]
    return {"city": data['city']['name'], "forecast": daily_forecasts}