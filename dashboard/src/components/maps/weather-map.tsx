"use client";

// Leaflet touches `window` as soon as it's imported, so this file is loaded with
// next/dynamic({ ssr: false }) from map-view.tsx and never runs on the server.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMapEvents } from "react-leaflet";

import { fetchWeather, type Weather } from "@/lib/weather";

interface Spot {
  lat: number;
  lon: number;
  weather?: Weather;
  error?: string;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function WeatherMap({ center }: { center: [number, number] }) {
  const [spot, setSpot] = useState<Spot>({ lat: center[0], lon: center[1] });

  useEffect(() => {
    const ctrl = new AbortController();
    fetchWeather(spot.lat, spot.lon, ctrl.signal)
      .then((weather) => setSpot((s) => (s.lat === spot.lat && s.lon === spot.lon ? { ...s, weather } : s)))
      .catch((e) => e.name !== "AbortError" && setSpot((s) => ({ ...s, error: e.message })));
    return () => ctrl.abort();
  }, [spot.lat, spot.lon]);

  return (
    <MapContainer center={center} zoom={5} scrollWheelZoom className="h-[min(70dvh,560px)] w-full rounded-xl border" attributionControl>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={(lat, lon) => setSpot({ lat, lon })} />
      <CircleMarker
        key={`${spot.lat},${spot.lon}`}
        center={L.latLng(spot.lat, spot.lon)}
        radius={9}
        pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#2a78d6", fillOpacity: 1 }}
        eventHandlers={{ add: (e) => e.target.openPopup() }}
      >
        <Popup>
          <div className="min-w-36 text-sm [&_p]:!my-0.5">
            <p className="font-semibold">
              {spot.lat.toFixed(2)}°, {spot.lon.toFixed(2)}°
            </p>
            {spot.error ? (
              <p>{spot.error}</p>
            ) : spot.weather ? (
              <>
                <p className="text-lg font-semibold">{Math.round(spot.weather.temperature)}°C</p>
                <p>{spot.weather.description}</p>
                <p>Wind {Math.round(spot.weather.windSpeed)} km/h</p>
              </>
            ) : (
              <p>Loading…</p>
            )}
          </div>
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
