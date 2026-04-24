from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv() 

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print(" ERROR: Supabase credentials missing from .env file")

# Only initialize ONCE
supabase = create_client(url, key)

CACHE_TTL = timedelta(minutes=30)

def is_valid_cache(record):
    if not record.get("updated_at"):
        return False
    
    try:
        # Convert the Supabase string back into a Python datetime object
        # We strip the 'Z' or offset for a clean comparison
        updated_at_str = record["updated_at"].replace('Z', '+00:00')
        updated_at = datetime.fromisoformat(updated_at_str)
        
        # Use timezone-aware comparison to avoid errors
        now = datetime.now(timezone.utc)
        return now - updated_at < CACHE_TTL
    except Exception as e:
        print(f"Cache timing error: {e}")
        return False

def get_cached(city):
    try:
        # Note: Ensure your column in Supabase is actually named 'location_key'
        res = supabase.table("weather_cache").select("*").eq("location_key", city).execute()
        
        if res.data and len(res.data) > 0:
            record = res.data[0]
            if is_valid_cache(record):
                return record["weather_data"]
    except Exception as e:
        print(f"Supabase Fetch Error: {e}")
    return None

def set_cache(city, data):
    try:
        supabase.table("weather_cache").upsert({
            "location_key": city,
            "weather_data": data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    except Exception as e:
        print(f" Supabase Upsert Error: {e}")