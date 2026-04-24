AccessWeather
AccessWeather is a real-time weather dashboard for the UK. It provides city search, hourly forecasts, and a 7-day forecast, featuring dynamic backgrounds that react to weather conditions and time of day.

## Features
Real-time Weather: Accurate data via OpenWeather API.

Smart Caching: Python backend saves results to Supabase for 30 minutes to optimize API usage.

Detailed Metrics: Air quality, wind speed, humidity, and more.

Dynamic UI: Backgrounds and icons change based on current weather state.

## Tech Stack
Frontend: Next.js (App Router), React, CSS

Backend: Python 3.10+, FastAPI, Uvicorn

Database: Supabase (PostgreSQL) for caching

APIs: OpenWeather API (Weather & Geocoding)

## Backend Setup (Python)
Navigate to backend:

Bash
cd backend
Setup Virtual Environment:

Bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate
Install Dependencies:

Bash
pip install -r requirements.txt
Environment Variables: Create a .env file in the backend/ folder:

Ini, TOML
OPENWEATHER_API_KEY=your_key
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
Run the Backend:

Bash
python -m uvicorn app.main:app --reload --port 8001
 Frontend Setup (Next.js)
Install Dependencies:

Bash
npm install
Environment Variables: Create a .env.local file in the root project directory:

Bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001/api
Run the Frontend:

Bash
npm run dev
Open http://localhost:3000 to view the app.

 Database Schema
To enable caching, run this SQL in your Supabase SQL Editor:

SQL
create table weather_cache (
  location_key text primary key,
  weather_data jsonb not null,
  updated_at timestamptz default now()
);
 Project Routes
/ — Home: Search and popular cities dashboard.

/city?city=London — Details: Full weather breakdown for the selected city.

/info — Support: Information about the application.

## License
Internal coursework project.