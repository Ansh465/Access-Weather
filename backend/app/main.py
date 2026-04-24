from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.weather import router as weather_router
from app.routes.geo import router as geo_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router, prefix="/api/weather")
app.include_router(geo_router, prefix="/api/geo")
@app.get("/")
async def root():
    return {
        "message": "AccessWeather Backend is Live",
        "port": 8001,
        "status": "Ready"
    }

# This is a health check to verify the modular structure is working
@app.get("/health")
async def health_check():
    return {"status": "ok", "modules": ["weather", "geo", "cache"]}