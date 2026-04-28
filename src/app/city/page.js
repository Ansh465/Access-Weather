"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

const iconSearch = "/icon/search.svg";
const iconCloudHero = "/icon/Cloud.svg";
const iconWindHero = "/icon/Wind.svg";
const iconCloud = "/icon/Cloud-1.svg";
const iconCloudAlt = "/icon/Cloud-2.svg";
const iconCloudRain = "/icon/CloudRain.svg";
const iconCloudRainAlt = "/icon/CloudRain-1.svg";
const iconSun = "/icon/Sun.svg";
const iconSunAlt = "/icon/Sun-1.svg";
const iconSnow = "/icon/Cloud-3.svg";
const iconCloudDrizzle = "/icon/CloudDrizzle.svg";
const iconWind = "/icon/Wind-1.svg";
const iconSunrise = "/icon/Sunrise.svg";
const iconDroplets = "/icon/Droplets.svg";
const iconGauge = "/icon/Gauge.svg";
const iconEye = "/icon/Eye.svg";
const iconSunSmall = "/icon/Sun-1.svg";

const DEFAULT_CITY = "London";
const GOOGLE_BASE = "/api/v1";

const iconByCondition = (type) => {
  const upper = (type || "").toUpperCase();
  if (upper.includes("THUNDER")) return iconCloudRainAlt;
  if (upper.includes("RAIN") || upper.includes("SHOWERS")) return iconCloudRain;
  if (upper.includes("DRIZZLE")) return iconCloudDrizzle;
  if (upper.includes("SNOW") || upper.includes("ICE")) return iconSnow;
  if (upper.includes("CLEAR")) return iconSun;
  if (upper.includes("PARTLY")) return iconCloudAlt;
  if (upper.includes("CLOUD")) return iconCloud;
  return iconSunAlt;
};

const formatCardinal = (value) => {
  if (!value) return "N";
  const map = {
    NORTH: "N",
    SOUTH: "S",
    EAST: "E",
    WEST: "W",
    NORTHEAST: "NE",
    NORTHWEST: "NW",
    SOUTHEAST: "SE",
    SOUTHWEST: "SW",
    NORTH_NORTHEAST: "NNE",
    NORTH_NORTHWEST: "NNW",
    SOUTH_SOUTHEAST: "SSE",
    SOUTH_SOUTHWEST: "SSW",
    EAST_NORTHEAST: "ENE",
    EAST_SOUTHEAST: "ESE",
    WEST_NORTHWEST: "WNW",
    WEST_SOUTHWEST: "WSW"
  };
  return map[value] || value.replace(/_/g, " ");
};

const formatIsoTime = (iso, timeZoneId, withMeridiem = true) => {
  if (!iso) return "--";
  const date = new Date(iso);
  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: withMeridiem,
    timeZone: timeZoneId || "UTC"
  });
};

const formatDay = (displayDate, timeZoneId, index) => {
  if (!displayDate) return "--";
  if (index === 0) return "Today";
  const date = new Date(Date.UTC(displayDate.year, displayDate.month - 1, displayDate.day));
  return date.toLocaleDateString("en-GB", { weekday: "short", timeZone: timeZoneId || "UTC" });
};

const formatDate = (iso, timeZoneId) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: timeZoneId || "UTC"
  });
};

const formatCondition = (value) => {
  if (!value) return "";
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatHour = (displayDateTime) => {
  if (!displayDateTime) return "--";
  const hour = displayDateTime.hours ?? 0;
  const period = hour >= 12 ? "PM" : "AM";
  const display = ((hour + 11) % 12) + 1;
  return `${display} ${period}`;
};

const getConditionClass = (weather) => {
  const type = weather?.type?.toUpperCase() || "";
  if (type.includes("CLEAR")) return "clear";
  if (type.includes("CLOUD")) return "cloudy";
  if (type.includes("RAIN") || type.includes("SHOWERS") || type.includes("DRIZZLE")) return "rain";
  if (type.includes("THUNDER")) return "storm";
  if (type.includes("SNOW") || type.includes("ICE")) return "snow";
  return "cloudy";
};

const getTimeOfDay = (weatherData) => {
  if (typeof weatherData?.isDaytime !== "boolean") return "day";
  return weatherData.isDaytime ? "day" : "night";
};

const getRainColor = (val, expected) => {
  return "card-blue";
};

const getAQIColor = (aqi) => {
  if (!aqi) return "card-violet";
  if (aqi <= 50) return "card-mint";
  if (aqi <= 100) return "card-peach";
  return "card-rose";
};

const getUVColor = (uv) => {
  if (uv == null) return "card-rose";
  if (uv <= 2) return "card-mint";
  if (uv <= 5) return "card-peach";
  return "card-rose";
};

const getWindColor = (speed) => {
  if (speed == null) return "card-mint";
  if (speed >= 25) return "card-rose";
  if (speed >= 15) return "card-peach";
  return "card-mint";
};

const getFeelsColor = (temp) => {
  if (temp == null) return "card-pink";
  if (temp <= 10) return "card-blue";
  if (temp >= 25) return "card-rose";
  return "card-peach";
};

const getHumidityColor = (hum) => {
  if (hum == null) return "card-blue";
  if (hum >= 70) return "card-blue";
  if (hum <= 35) return "card-peach";
  return "card-sand";
};

function CityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCity = searchParams.get("city") || DEFAULT_CITY;

  const [city, setCity] = useState(initialCity);
  const [inputValue, setInputValue] = useState(initialCity);
  const [current, setCurrent] = useState(null);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [timeZoneId, setTimeZoneId] = useState("UTC");
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [notice, setNotice] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const airKey = process.env.NEXT_PUBLIC_GOOGLE_AIR_QUALITY_API_KEY || apiKey;
  const cacheKey = `weatherCache:${city}`;
  const CACHE_TTL = 15 * 60 * 1000;

  useEffect(() => {
    setCity(initialCity);
    setInputValue(initialCity);
  }, [initialCity]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const denied = window.sessionStorage.getItem("locationDenied");
    if (denied) {
      setNotice("Location permission was denied. Enable it in your browser settings for a more accurate city.");
      window.sessionStorage.removeItem("locationDenied");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !city) return;
    const cached = window.localStorage.getItem(cacheKey);
    if (!cached) return;

    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_TTL) return;
      setCurrent(parsed.current || null);
      setHourlyForecast(parsed.hourlyForecast || []);
      setDailyForecast(parsed.dailyForecast || []);
      setAirQuality(parsed.airQuality || null);
      setTimeZoneId(parsed.timeZoneId || "UTC");
    } catch {
      // Ignore corrupted cache.
    }
  }, [cacheKey, city]);

  useEffect(() => {
    if (!city) return;

    const load = async () => {
      setStatus({ loading: true, error: "" });
      try {
        const geoRes = await fetch(
          `/api/geocode?address=${encodeURIComponent(city)}`
        );
        if (!geoRes.ok) throw new Error("Failed to load city");
        const geoData = await geoRes.json();
        const geo = geoData.results?.[0]?.geometry?.location;
        if (!geo) throw new Error("City not found");

        const [currentRes, hourlyRes, dailyRes, airRes] = await Promise.all([
          fetch(
            `${GOOGLE_BASE}/currentConditions:lookup?key=${apiKey}&location.latitude=${geo.lat}&location.longitude=${geo.lng}`
          ),
          fetch(
            `${GOOGLE_BASE}/forecast/hours:lookup?key=${apiKey}&location.latitude=${geo.lat}&location.longitude=${geo.lng}&hours=24`
          ),
          fetch(
            `${GOOGLE_BASE}/forecast/days:lookup?key=${apiKey}&location.latitude=${geo.lat}&location.longitude=${geo.lng}&days=7`
          ),
          fetch(`/api/airquality`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              location: {
                latitude: geo.lat,
                longitude: geo.lng
              }
            })
          })
        ]);

        if (!currentRes.ok || !hourlyRes.ok || !dailyRes.ok) {
          throw new Error("Failed to load weather");
        }

        const currentData = await currentRes.json();
        const hourlyData = await hourlyRes.json();
        const dailyData = await dailyRes.json();
        const airData = airRes.ok ? await airRes.json() : null;

        const nextCurrent = currentData;
        const nextHourly = hourlyData.forecastHours || [];
        const nextDaily = dailyData.forecastDays || [];
        const nextTimeZone = dailyData.timeZone?.id || hourlyData.timeZone?.id || "UTC";

        setCurrent(nextCurrent);
        setHourlyForecast(nextHourly);
        setDailyForecast(nextDaily);
        setAirQuality(airData);
        setTimeZoneId(nextTimeZone);
        setStatus({ loading: false, error: "" });

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({
              timestamp: Date.now(),
              current: nextCurrent,
              hourlyForecast: nextHourly,
              dailyForecast: nextDaily,
              airQuality: airData,
              timeZoneId: nextTimeZone
            })
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load";
        setStatus({ loading: false, error: message });
      }
    };

    load();
  }, [apiKey, city]);

  const hourly = useMemo(() => {
    return hourlyForecast.slice(0, 16).map((item) => ({
      time: formatHour(item.displayDateTime),
      temp: Math.round(item.temperature?.degrees ?? 0),
      pop: item.precipitation?.probability?.percent ?? 0,
      icon: iconByCondition(item.weatherCondition?.type)
    }));
  }, [hourlyForecast]);

  const daily = useMemo(() => {
    const items = dailyForecast.slice(0, 7).map((item, index) => ({
      day: formatDay(item.displayDate, timeZoneId, index),
      min: Math.round(item.minTemperature?.degrees ?? 0),
      max: Math.round(item.maxTemperature?.degrees ?? 0),
      icon: iconByCondition(
        item.daytimeForecast?.weatherCondition?.type ||
          item.nighttimeForecast?.weatherCondition?.type ||
          item.weatherCondition?.type
      )
    }));
    while (items.length < 7) {
      items.push({ day: "--", min: "--", max: "--", icon: iconCloud });
    }
    return items;
  }, [dailyForecast, timeZoneId]);

  const rainValue = current?.precipitation?.qpf?.quantity ?? 0;
  const expectedRain = hourlyForecast
    .slice(0, 24)
    .reduce((total, item) => total + (item.precipitation?.qpf?.quantity || 0), 0);
  const windSpeed = current?.wind?.speed?.value ?? null;
  const visibilityKm = current?.visibility?.distance ?? "--";
  const sunrise = dailyForecast[0]?.sunEvents?.sunriseTime || null;
  const sunset = dailyForecast[0]?.sunEvents?.sunsetTime || null;
  const todayMin = dailyForecast[0]?.minTemperature?.degrees ?? null;
  const todayMax = dailyForecast[0]?.maxTemperature?.degrees ?? null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputValue.trim()) return;
    router.push(`/city?city=${encodeURIComponent(inputValue.trim())}`);
  };

  const conditionClass = getConditionClass(current?.weatherCondition);
  const timeOfDay = getTimeOfDay(current);

  const heroIcon = current?.weatherCondition
    ? iconByCondition(current.weatherCondition.type)
    : iconCloudHero;

  return (
    <main className={`page detail-page weather-${conditionClass} ${timeOfDay}`} data-node-id="42:674">
      {status.loading ? (
        <div className="page-overlay" role="status" aria-live="polite">
          <div className="overlay-card">
            <div className="spinner" aria-hidden="true" />
            <p>Fetching the latest forecast...</p>
          </div>
        </div>
      ) : null}
      <Header>
        <form className="header-search" onSubmit={handleSubmit} data-node-id="42:679">
          <img src={iconSearch} alt="" aria-hidden="true" />
          <input
            aria-label="Search city"
            placeholder="Search....."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
        </form>
      </Header>

      <section className="detail-layout" data-node-id="42:690">
        <div className="detail-main" data-node-id="42:691">
          <div className="hero" data-node-id="42:693">
            <div>
              <h1 data-node-id="42:695">{city}</h1>
              <p className="hero-date" data-node-id="42:697">
                {formatDate(current?.currentTime, timeZoneId)}
              </p>
              <h2 data-node-id="42:699">{formatCondition(current?.weatherCondition?.description?.text)}</h2>
            </div>
            <div className="hero-temp" data-node-id="42:700">
              <span>{current ? Math.round(current.temperature?.degrees ?? 0) : "--"}°C</span>
              <div className="hero-icon">
                <img className="hero-icon-main" src={heroIcon} alt="" aria-hidden="true" />
                {windSpeed ? (
                  <img className="hero-icon-wind" src={iconWindHero} alt="" aria-hidden="true" />
                ) : null}
              </div>
            </div>
          </div>

          <div className="hourly" data-node-id="42:711">
            <h3 data-node-id="42:713">hourly forecast</h3>
            <div className="hourly-grid" data-node-id="42:714">
              {status.loading || hourly.length === 0
                ? Array.from({ length: 8 }).map((_, index) => (
                    <article className="hour-card skeleton" key={`skeleton-${index}`}>
                      <div className="skeleton-line" />
                      <div className="skeleton-circle" />
                      <div className="skeleton-line short" />
                      <div className="skeleton-line" />
                    </article>
                  ))
                : hourly.map((item, index) => (
                    <article className="hour-card" key={`${item.time}-${index}`} data-node-id="42:715">
                      <p>{item.time}</p>
                      <div className="hour-icon">
                        <img src={item.icon} alt="" aria-hidden="true" />
                      </div>
                      {item.pop ? <span className="hour-pop">{item.pop}%</span> : <span className="hour-pop">&nbsp;</span>}
                      <p className="hour-temp">{item.temp}°</p>
                    </article>
                  ))}
            </div>
          </div>
        </div>

        <aside className="week-card" data-node-id="42:720">
          {status.loading || daily.length === 0
            ? Array.from({ length: 7 }).map((_, index) => (
                <div className="week-row skeleton" key={`week-skeleton-${index}`}>
                  <div className="skeleton-line" />
                  <div className="skeleton-circle" />
                  <div className="skeleton-line short" />
                </div>
              ))
            : daily
                .filter((item) => item.day !== "--")
                .map((item) => (
                  <div className="week-row" key={item.day}>
                    <span>{item.day}</span>
                    <img src={item.icon} alt="" aria-hidden="true" />
                    <div className="week-temps">
                      <span>{item.max}°</span>
                      <span>{item.min}°</span>
                    </div>
                  </div>
                ))}
        </aside>
      </section>

      {notice ? <p className="status notice">{notice}</p> : null}
      {status.error ? <p className="status error">{status.error}</p> : null}

      <section className="metrics" data-node-id="42:900">
        <div className="metrics-grid four">
          <article className={`metric-card ${getRainColor(rainValue, expectedRain)}`}>
            <div className="metric-title">
              <img src={iconDroplets} alt="" aria-hidden="true" />
              <span>Rainfall</span>
            </div>
            <h4>{rainValue.toFixed(1)} mm</h4>
            <p>in last hour</p>
            <small>{expectedRain.toFixed(1)} mm expected in next 24h.</small>
          </article>
          <article className={`metric-card ${getAQIColor(airQuality?.indexes?.[0]?.aqi)}`}>
            <div className="metric-title">
              <img src={iconGauge} alt="" aria-hidden="true" />
              <span>Air Quality</span>
            </div>
            <h4>
              {airQuality?.indexes?.[0]
                ? `${airQuality.indexes[0].aqiDisplay || airQuality.indexes[0].aqi} - ${airQuality.indexes[0].category}`
                : "--"}
            </h4>
            <button className="ghost-btn" type="button">
              {airQuality?.indexes?.[0]?.dominantPollutant
                ? `Dominant: ${airQuality.indexes[0].dominantPollutant.toUpperCase()}`
                : "No data"}
            </button>
          </article>
          <article className={`metric-card ${getUVColor(current?.uvIndex)}`}>
            <div className="metric-title">
              <img src={iconSunSmall} alt="" aria-hidden="true" />
              <span>UV Index</span>
            </div>
            <h4>{current?.uvIndex ?? "N/A"}</h4>
            <div className="uv-bar" aria-hidden="true">
              <span />
            </div>
            <small>Moderate</small>
          </article>
          <article className={`metric-card ${getWindColor(windSpeed)}`}>
            <div className="metric-title">
              <img src={iconWind} alt="" aria-hidden="true" />
              <span>Wind</span>
            </div>
            <h4>{windSpeed ? `${windSpeed.toFixed(1)} km/h` : "--"}</h4>
            <p>{formatCardinal(current?.wind?.direction?.cardinal)}</p>
            <small>Gusts: {current?.wind?.gust?.value ? `${current.wind.gust.value.toFixed(1)} km/h` : "--"}</small>
          </article>
        </div>

        <div className="metrics-grid four">
          <article className={`metric-card ${getFeelsColor(current?.feelsLikeTemperature?.degrees ?? current?.temperature?.degrees)}`}>
            <div className="metric-title">
              <img src={iconSunSmall} alt="" aria-hidden="true" />
              <span>Feels Like</span>
            </div>
            <h4>{current ? `${Math.round(current.feelsLikeTemperature?.degrees ?? 0)}°` : "--"}</h4>
            <small>Similar to the actual temperature.</small>
          </article>
          <article className={`metric-card ${getHumidityColor(current?.relativeHumidity)}`}>
            <div className="metric-title">
              <img src={iconDroplets} alt="" aria-hidden="true" />
              <span>Humidity</span>
            </div>
            <h4>{current ? `${current.relativeHumidity ?? "--"}%` : "--"}</h4>
            <small>Dew point: {current ? `${Math.round(current.dewPoint?.degrees ?? 0)}°` : "--"}</small>
          </article>
          <article className="metric-card card-sun">
            <div className="metric-title">
              <img src={iconSunrise} alt="" aria-hidden="true" />
              <span>Sunrise</span>
            </div>
            <h4>{formatIsoTime(sunrise, timeZoneId)}</h4>
            <div className="sun-bar" aria-hidden="true" />
            <small>Sunset: {formatIsoTime(sunset, timeZoneId)}</small>
          </article>
          <article className="metric-card card-sun">
            <div className="metric-title">
              <img src={iconSunrise} alt="" aria-hidden="true" />
              <span>Sunset</span>
            </div>
            <h4>{formatIsoTime(sunset, timeZoneId)}</h4>
            <div className="sun-bar" aria-hidden="true" />
            <small>Sunrise: {formatIsoTime(sunrise, timeZoneId)}</small>
          </article>
        </div>

        <div className="metrics-grid two">
          <article className="metric-card card-lilac">
            <div className="metric-title">
              <img src={iconEye} alt="" aria-hidden="true" />
              <span>Visibility</span>
            </div>
            <h4>{visibilityKm} km</h4>
            <small>Similar to the actual temperature.</small>
          </article>
          <article className="metric-card card-lilac">
            <div className="metric-title">
              <span>{city}</span>
              <span className="metric-time">{formatIsoTime(current?.currentTime, timeZoneId, false)}</span>
            </div>
            <p>{formatCondition(current?.weatherCondition?.description?.text) || "--"}</p>
            <h4>{todayMax !== null ? `${Math.round(todayMin)}° / ${Math.round(todayMax)}°` : "--"}</h4>
            <div className="mini-icon">
              <img src={heroIcon} alt="" aria-hidden="true" />
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

export default function CityPage() {
  return (
    <Suspense fallback={
      <div className="page-overlay" role="status" aria-live="polite">
        <div className="overlay-card">
          <div className="spinner" aria-hidden="true" />
          <p>Loading application assets...</p>
        </div>
      </div>
    }>
      <CityPageContent />
    </Suspense>
  );
}
