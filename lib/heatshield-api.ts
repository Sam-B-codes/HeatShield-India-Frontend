export type MonitoringLocation = {
  state: string;
  district: string;
};

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

export type Assessment = {
  risk_level?: RiskLevel;
  htsi?: number;
  supporting_metrics?: { heat_index_c?: number; wbgt_proxy_c?: number };
  recommended_actions?: Array<string | { title?: string; action?: string; priority?: string }>;
  affected_groups?: Array<string | { group?: string; label?: string; percentage?: number }>;
  health_impact?: { level?: RiskLevel; score?: number; status?: string };
  data_status?: string;
};

export type ForecastPoint = {
  time: string | null;
  temperature: number | null;
  relative_humidity: number | null;
  wind_speed: number | null;
  shortwave_radiation?: number | null;
  assessment?: Assessment | null;
};

export type WeatherResponse = {
  area?: {
    city_id?: string;
    name?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    population?: number | null;
    area_km2?: number | null;
    population_density?: number | null;
  } | null;
  demographics?: {
    population_2011?: number;
    area_km2?: number;
    population_density_2011?: number;
    data_year?: number;
  } | null;
  current: {
    time: string | null;
    temperature: number | null;
    relative_humidity: number | null;
    wind_speed: number | null;
    shortwave_radiation?: number | null;
    assessment?: Assessment | null;
  };
  forecast: ForecastPoint[];
  forecast_24h?: ForecastPoint[];
  forecast_48h?: ForecastPoint[];
  forecast_72h?: ForecastPoint[];
  data_status?: string;
};

export class HeatShieldApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HeatShieldApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new HeatShieldApiError("The HeatShield backend is unreachable.", 0, "BACKEND_UNREACHABLE");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as
      | { detail?: string | { code?: string; message?: string } }
      | null;
    const detail = payload?.detail;
    const message = typeof detail === "string" ? detail : detail?.message;
    throw new HeatShieldApiError(
      message || `HeatShield API request failed (${response.status})`,
      response.status,
      typeof detail === "object" ? detail?.code : undefined,
    );
  }
  return response.json() as Promise<T>;
}

const query = (values: Record<string, string | undefined>) =>
  new URLSearchParams(
    Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();

export const heatShieldApi = {
  getWeather: (location: MonitoringLocation) =>
    request<WeatherResponse>(`/api/weather?${query(location)}`),
  resolveLocation: (location: MonitoringLocation) =>
    request(`/api/locations/resolve?${query(location)}`),
  getSupportedLocations: () => request("/api/locations"),
  getHaldiaMap: () => request("/api/haldia-gis"),
};
