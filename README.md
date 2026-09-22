# HeatShield India Frontend

HeatShield India is a government heat-action decision-support dashboard. It provides a searchable State → District selector, state district maps, live prototype weather/risk data for backend-supported locations, and explicit data-unavailable states elsewhere.

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Vite 8 through Vinext
- Recharts
- `svgmap-india`
- pnpm

## Local setup

The FastAPI backend and frontend must run at the same time.

### 1. Start the backend

From the backend directory:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Verify it at `http://127.0.0.1:8000/api/health`.

### 2. Configure the frontend

Copy `.env.example` to `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

The default value is:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

For a deployed backend, replace it with the HTTPS backend URL and restart the frontend.

### 3. Start the frontend

```powershell
pnpm install
pnpm dev
```

Use the local URL printed by Vite.

## Location and map behavior

- Haldia is the default monitoring location and maps to West Bengal / Purba Medinipur.
- All states, union territories, and package-provided districts are searchable.
- Clicking a district boundary updates the district selection and requests fresh backend data.
- The backend currently has live prototype data for selected cities only.
- Unsupported districts remain selectable and keep their boundary map, but the dashboard shows `Data unavailable` instead of unrelated mock values.
- Detailed municipal ward GeoJSON is currently available only for Haldia through `/api/haldia-gis`.

## Backend endpoints used

- `GET /api/locations`
- `GET /api/locations/resolve?state=...&district=...`
- `GET /api/weather?state=...&district=...`
- `GET /api/haldia-gis`

## Validation

```powershell
pnpm exec tsc --noEmit
pnpm build
```
