"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const iconSearch = "/icon/search.svg";
const iconSearchLarge = "/icon/Search-1.svg";
const iconTrending = "/icon/TrendingUp.svg";
const iconPin = "/icon/MapPin.svg";

const POPULAR_CITIES = [
  { name: "London" },
  { name: "Manchester" },
  { name: "Edinburgh" },
  { name: "Cardiff" },
  { name: "Birmingham" },
  { name: "Glasgow" }
];

const RECENT_LIMIT = 5;

// Helper to capitalize descriptions (e.g., "clear sky" -> "Clear Sky")
function formatCondition(value) {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [popular, setPopular] = useState([]);
  const [recent, setRecent] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "" });

  // 1. Load Recent Searches from LocalStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("weatherRecent");
    if (stored) {
      try {
        setRecent(JSON.parse(stored));
      } catch {
        setRecent([]);
      }
    }
  }, []);

  // 2. Load Popular Cities via PYTHON BACKEND
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const data = await Promise.all(
          POPULAR_CITIES.map(async (city) => {
            // Handshake with Python Backend
            const res = await fetch(`http://127.0.0.1:8001/api/weather/current?city=${encodeURIComponent(city.name)}`);
            if (!res.ok) throw new Error("Failed to fetch");
            
            const json = await res.json();
            
            // UPDATED: Mapping to your Python format_weather keys
            return {
              name: json.city,              // from data["name"] in python
              temp: Math.round(json.temperature), // from data["main"]["temp"] in python
              condition: formatCondition(json.description) // from data["weather"][0]["description"]
            };
          })
        );
        setPopular(data);
      } catch (err) {
        console.error("Popular cities load failed:", err);
        setPopular([]);
      }
    };
    loadPopular();
  }, []);

  // 3. Handle the Search through PYTHON BACKEND
  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;

    setStatus({ loading: true, error: "" });

    try {
      const res = await fetch(`http://127.0.0.1:8001/api/weather/current?city=${encodeURIComponent(query)}`);
      
      if (!res.ok) throw new Error("City not found or Backend Offline");
      
      const data = await res.json();

      // UPDATED: Mapping to your Python keys
      const entry = {
        name: data.city,
        temp: Math.round(data.temperature),
        condition: formatCondition(data.description)
      };

      // Save to recent searches
      setRecent((prev) => {
        const nextRecent = [entry, ...prev]
          .filter((item, index, self) => self.findIndex((value) => value.name === item.name) === index)
          .slice(0, RECENT_LIMIT);
        
        if (typeof window !== "undefined") {
          window.localStorage.setItem("weatherRecent", JSON.stringify(nextRecent));
        }
        return nextRecent;
      });

      setStatus({ loading: false, error: "" });
      
      // Navigate to the city page
      router.push(`/city?city=${encodeURIComponent(entry.name)}`);
    } catch (error) {
      setStatus({ loading: false, error: error.message });
    }
  };

  const popularCards = useMemo(() => {
    if (!popular.length) {
      return POPULAR_CITIES.map((city) => ({
        name: city.name,
        temp: "--",
        condition: "Loading..."
      }));
    }
    return popular;
  }, [popular]);

  return (
    <main className="page">
      <Header>
        <div className="header-search">
          <img src={iconSearch} alt="" aria-hidden="true" />
          <input
            aria-label="Search cities"
            placeholder="Search....."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </Header>

      <section className="content">
        <h1>Search Cities</h1>

        <form className="search-card" onSubmit={handleSearch}>
          <img src={iconSearchLarge} alt="" aria-hidden="true" />
          <input
            aria-label="Search for a city"
            placeholder="Search for a city..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="cta" type="submit" disabled={status.loading}>
            {status.loading ? "Searching..." : "Search"}
          </button>
        </form>
        
        {status.error && (
          <p className="status error" style={{ color: 'red', marginTop: '10px' }}>
            {status.error}
          </p>
        )}

        <div className="section">
          <div className="section-title">
            <img src={iconTrending} alt="" aria-hidden="true" />
            <h2>Popular Cities (Live via Python)</h2>
          </div>
          <div className="grid">
            {popularCards.map((city) => (
              <article className="city-card" key={city.name}>
                <div className="city-name">
                  <img src={iconPin} alt="" aria-hidden="true" />
                  <h3>{city.name}</h3>
                </div>
                <div className="city-meta">
                  <span className="temp">{city.temp}°C</span>
                  <span className="condition">{city.condition}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title no-icon">
            <h2>Recent Searches</h2>
          </div>
          <div className="recent-card">
            {recent.length === 0 ? (
              <p>No recent searches</p>
            ) : (
              <div className="recent-grid">
                {recent.map((item) => (
                  <div className="recent-item" key={item.name}>
                    <div>
                      <span className="recent-city">{item.name}</span>
                      <span className="recent-condition">{item.condition}</span>
                    </div>
                    <span className="recent-temp">{item.temp}°C</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}