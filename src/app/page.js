"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";

export default function CityPage() {
  const searchParams = useSearchParams();
  const city = searchParams.get("city");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city) return;

    const fetchForecast = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8001/api/weather/forecast?city=${encodeURIComponent(city)}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Forecast fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [city]);

  if (loading) return <div className="page">Loading Forecast...</div>;

  return (
    <main className="page">
      <Header />
      <section className="content">
        <h1>{data?.city} - 5 Day Forecast</h1>

        <div className="forecast-container" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '20px 0' }}>
          {data?.forecast.map((day) => (
            <div key={day.date} className="city-card" style={{ minWidth: '150px', textAlign: 'center' }}>
              <h3>{day.day}</h3>
              <p>{day.date}</p>
              <img 
                src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`} 
                alt={day.description} 
              />
              <div className="temp" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {day.temp}°C
              </div>
              <p className="condition">{day.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}