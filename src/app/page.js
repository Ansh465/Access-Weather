"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSelection, setIsSelection] = useState(false);
  const [popularCities, setPopularCities] = useState([
    { name: "London", temp: "--", condition: "--" },
    { name: "Manchester", temp: "--", condition: "--" },
    { name: "Edinburgh", temp: "--", condition: "--" },
    { name: "Cardiff", temp: "--", condition: "--" },
    { name: "Birmingham", temp: "--", condition: "--" },
    { name: "Glasgow", temp: "--", condition: "--" }
  ]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    if (isSelection) {
      setIsSelection(false);
      return;
    }

    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (e) {
        // fallback
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isSelection]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("weatherRecent");
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "granted") {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const res = await fetch(
                `/api/geocode/reverse?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}`
              );
              if (res.ok) {
                const data = await res.json();
                const geoResult = data.results?.[0];
                if (geoResult) {
                  const locality = geoResult.address_components?.find((item) =>
                    item.types.includes("locality") || item.types.includes("postal_town")
                  );
                  const region = geoResult.address_components?.find((item) =>
                    item.types.includes("administrative_area_level_1")
                  );
                  const name = locality?.long_name || geoResult.formatted_address;
                  const cityName = `${name}${region ? `, ${region.short_name || region.long_name}` : ""}`;
                  navigate(cityName);
                }
              }
            } catch (e) {
              console.error("Auto-location error", e);
            }
          });
        }
      });
    }

    const fetchPopularCities = async () => {
      const cities = ["London", "Manchester", "Edinburgh", "Cardiff", "Birmingham", "Glasgow"];
      const fallbackMap = {
        "London": { temp: "12°C", condition: "Partly Cloudy" },
        "Manchester": { temp: "10°C", condition: "Rainy" },
        "Edinburgh": { temp: "8°C", condition: "Windy" },
        "Cardiff": { temp: "13°C", condition: "Sunny" },
        "Birmingham": { temp: "11°C", condition: "Cloudy" },
        "Glasgow": { temp: "9°C", condition: "Cloudy" }
      };

      try {
        const updated = await Promise.all(cities.map(async (city) => {
          try {
            const res = await fetch(`http://127.0.0.1:8001/forecast/${encodeURIComponent(city)}`);
            const json = await res.json();
            if (json && json.forecast && json.forecast.length > 0) {
              return {
                name: city,
                temp: `${json.forecast[0].temp}°C`,
                condition: json.forecast[0].description
              };
            }
          } catch (e) {
            console.error(e);
          }
          return { name: city, ...fallbackMap[city] };
        }));
        setPopularCities(updated);
      } catch (e) {
        console.error(e);
      }
    };

    fetchPopularCities();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(searchQuery.trim());
  };

  const navigate = (cityName) => {
    if (typeof window !== "undefined") {
      const updated = [
        { name: cityName, timestamp: Date.now() },
        ...recentSearches.filter(item => item.name.toLowerCase() !== cityName.toLowerCase())
      ].slice(0, 5);
      setRecentSearches(updated);
      window.localStorage.setItem("weatherRecent", JSON.stringify(updated));
    }
    router.push(`/city?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <main className="page">
      <Header>
        <form className="header-search" onSubmit={handleSearch}>
          <img src="/icon/search.svg" alt="" aria-hidden="true" />
          <input 
            aria-label="Search city" 
            placeholder="Search....." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown">
              {suggestions.map((item, index) => (
                <li key={index} onMouseDown={() => {
                  setIsSelection(true);
                  setSearchQuery(item);
                  setShowSuggestions(false);
                  navigate(item);
                }}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </form>
      </Header>

      <section className="content">
        <h1>Search Cities</h1>

        <form className="search-card" onSubmit={handleSearch}>
          <img src="/icon/search.svg" alt="" aria-hidden="true" />
          <input 
            aria-label="Search for a city" 
            placeholder="Search for a city..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="autocomplete-dropdown">
              {suggestions.map((item, index) => (
                <li key={index} onMouseDown={() => {
                  setIsSelection(true);
                  setSearchQuery(item);
                  setShowSuggestions(false);
                  navigate(item);
                }}>
                  {item}
                </li>
              ))}
            </ul>
          )}
          <button type="submit" className="cta">Search</button>
        </form>

        <div className="section">
          <div className="section-title">
            <img src="/icon/TrendingUp.svg" alt="" aria-hidden="true" style={{ width: 20, height: 20 }} />
            <h2>Popular Cities</h2>
          </div>

          <div className="grid">
            {popularCities.map((city) => (
              <article 
                key={city.name} 
                className="city-card" 
                style={{ cursor: 'pointer' }} 
                onClick={() => navigate(city.name)}
              >
                <div className="city-name">
                  <img src="/icon/MapPin.svg" alt="" aria-hidden="true" style={{ width: 16, height: 16 }} />
                  <h3>{city.name}</h3>
                </div>
                <div className="city-meta">
                  <span className="temp">{city.temp}</span>
                  <span className="condition" style={{ textTransform: 'capitalize' }}>{city.condition}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-title no-icon">
            <h2>Recent Searches</h2>
          </div>

          {recentSearches.length === 0 ? (
            <div className="recent-card">
              <p>No recent searches</p>
            </div>
          ) : (
            <div className="recent-grid">
              {recentSearches.map((item) => (
                <div 
                  key={item.name} 
                  className="recent-item" 
                  style={{ cursor: 'pointer' }} 
                  onClick={() => navigate(item.name)}
                >
                  <div>
                    <span className="recent-city">{item.name}</span>
                  </div>
                  <img src="/icon/ChevronRight.svg" alt="" aria-hidden="true" style={{ width: 16, height: 16 }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}