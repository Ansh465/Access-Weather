"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const iconMenu = "/icon/Menu.svg";

const DEFAULT_CITY_LINK = "/city?city=London";

export default function Header({ children }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cityLink, setCityLink] = useState(DEFAULT_CITY_LINK);
  const [locating, setLocating] = useState(false);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("weatherRecent");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      const last = Array.isArray(parsed) ? parsed[0] : null;
      if (last?.name) {
        setCityLink(`/city?city=${encodeURIComponent(last.name)}`);
      }
    } catch {
      // Ignore corrupted storage.
    }
  }, []);

  const menuLinks = useMemo(
    () => [
      { label: "Search", href: "/" },
      { label: "City Forecast", href: cityLink },
      { label: "Info & Support", href: "/info" }
    ],
    [cityLink]
  );

  const closeMenu = () => setOpen(false);

  const resolveCityFromCoords = async (latitude, longitude) => {
    if (!apiKey) throw new Error("Missing API key");
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );
    if (!res.ok) throw new Error("Failed to resolve location");
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) throw new Error("Location unavailable");
    const locality = result.address_components?.find((item) =>
      item.types.includes("locality") || item.types.includes("postal_town")
    );
    const region = result.address_components?.find((item) =>
      item.types.includes("administrative_area_level_1")
    );
    const name = locality?.long_name || result.formatted_address;
    return `${name}${region ? `, ${region.short_name || region.long_name}` : ""}`;
  };

  const handleLogoClick = async () => {
    if (locating) return;
    setLocating(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 300000
        });
      });
      const cityName = await resolveCityFromCoords(
        position.coords.latitude,
        position.coords.longitude
      );
      router.push(`/city?city=${encodeURIComponent(cityName)}`);
    } catch {
      router.push(cityLink);
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      <header className="header">
        <button className="pill logo-btn" type="button" onClick={handleLogoClick}>
          {locating ? "Locating..." : "ACCESSWEATHER"}
        </button>
        {children}
        <button
          className="menu-btn"
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <img src={iconMenu} alt="" aria-hidden="true" />
        </button>
      </header>

      {open ? (
        <div className="menu-overlay" role="presentation" onClick={closeMenu}>
          <nav className="menu-panel" aria-label="Site" onClick={(event) => event.stopPropagation()}>
            <h3>Menu</h3>
            <div className="menu-links">
              {menuLinks.map((item) => (
                <Link className="menu-link" key={item.label} href={item.href} onClick={closeMenu}>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
