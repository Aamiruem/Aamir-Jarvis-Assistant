// Current weather from Open-Meteo: free, no API key, CORS-enabled, so the browser calls it
// directly with the Fetch API.

export interface Weather {
  temperature: number;
  windSpeed: number;
  code: number;
  description: string;
}

// WMO weather interpretation codes, grouped.
const CODES: [number[], string][] = [
  [[0], "Clear sky"],
  [[1, 2], "Partly cloudy"],
  [[3], "Overcast"],
  [[45, 48], "Fog"],
  [[51, 53, 55, 56, 57], "Drizzle"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "Rain"],
  [[71, 73, 75, 77, 85, 86], "Snow"],
  [[95, 96, 99], "Thunderstorm"],
];

export const describeWeather = (code: number) => CODES.find(([codes]) => codes.includes(code))?.[1] ?? "Unknown";

export async function fetchWeather(lat: number, lon: number, signal?: AbortSignal): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,wind_speed_10m,weather_code`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Weather service failed (${res.status})`);
  const { current } = await res.json();
  return {
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m,
    code: current.weather_code,
    description: describeWeather(current.weather_code),
  };
}
