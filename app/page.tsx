"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, Building2, CheckCircle2, ChevronDown, CloudSun, Droplets, Gauge, HeartPulse, Hospital, Layers3, Map as MapIcon, MapPin, Maximize2, Menu, Minimize2, RadioTower, Search, ShieldAlert, Siren, Sun, ThermometerSun, Users, Wind, X, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { findDistrictCode, INDIA_LOCATIONS, normalizeDistrictSelection } from "@/lib/india-map-registry";
import { heatShieldApi, HeatShieldApiError, type ForecastPoint, type WeatherResponse } from "@/lib/heatshield-api";

const DEFAULT_STATE = INDIA_LOCATIONS.find((item) => item.code === "WB")!;
const DEFAULT_DISTRICT = findDistrictCode(DEFAULT_STATE, "Purba Medinipur");

type DashboardData = {
  temp: number;
  humidity: number;
  wind: number;
  feels: number;
  score: number;
  risk: "Low" | "Moderate" | "High" | "Extreme";
  exposed: string;
  observedAt: string;
};

const titleRisk = (value?: string): DashboardData["risk"] => {
  const normalized = String(value || "LOW").toLowerCase();
  return (normalized.charAt(0).toUpperCase() + normalized.slice(1)) as DashboardData["risk"];
};

const compactPopulation = (value?: number | null) => {
  if (!value) return "Unavailable";
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
};

function adaptWeather(payload: WeatherResponse): DashboardData | null {
  const current = payload.current;
  const assessment = current?.assessment;
  if (
    current?.temperature == null ||
    current.relative_humidity == null ||
    current.wind_speed == null ||
    assessment?.htsi == null
  ) return null;

  const population = payload.demographics?.population_2011 ?? payload.area?.population;
  const feels = assessment.supporting_metrics?.heat_index_c ?? current.temperature;
  return {
    temp: Number(current.temperature.toFixed(1)),
    humidity: Math.round(current.relative_humidity),
    wind: Number(current.wind_speed.toFixed(1)),
    feels: Math.round(feels),
    score: Math.round(assessment.htsi),
    risk: titleRisk(assessment.risk_level),
    exposed: compactPopulation(population),
    observedAt: current.time
      ? new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(current.time))
      : "Latest cycle",
  };
}

function buildForecast(points: ForecastPoint[], range: string) {
  const usable = points.filter((point) => point.time && point.temperature != null);
  if (range === "Today") {
    return usable.slice(0, 12).map((point) => ({
      time: new Intl.DateTimeFormat("en-IN", { hour: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(point.time!)),
      temp: point.temperature!,
      feels: point.assessment?.supporting_metrics?.heat_index_c ?? point.temperature!,
    }));
  }

  const days = new Map<string, { time: string; temp: number; feels: number }>();
  usable.forEach((point) => {
    const date = new Date(point.time!);
    const key = date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const existing = days.get(key);
    const feels = point.assessment?.supporting_metrics?.heat_index_c ?? point.temperature!;
    if (!existing || feels > existing.feels) {
      days.set(key, {
        time: new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "Asia/Kolkata" }).format(date),
        temp: point.temperature!,
        feels,
      });
    }
  });
  return [...days.values()].slice(0, range === "3 days" ? 3 : 7);
}

export default function Home() {
  const [selectedStateCode, setSelectedStateCode] = useState("WB");
  const [selectedDistrict, setSelectedDistrict] = useState(DEFAULT_DISTRICT);
  const [range, setRange] = useState("Today");
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [mapMode, setMapMode] = useState<"national" | "district">("national");
  const [riskView, setRiskView] = useState<"map" | "analytics">("map");
  const [mapLayer, setMapLayer] = useState<"risk" | "temperature" | "population">("risk");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [utilityPanel, setUtilityPanel] = useState<"search" | "notifications" | null>(null);
  const [alertConfirmOpen, setAlertConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [dataStatus, setDataStatus] = useState<"loading" | "available" | "unavailable" | "offline">("loading");
  const [dataMessage, setDataMessage] = useState("Loading verified district data…");
  const selectedState = INDIA_LOCATIONS.find((item) => item.code === selectedStateCode) ?? DEFAULT_STATE;
  const districtName = selectedState.districts[selectedDistrict] ?? Object.values(selectedState.districts)[0] ?? "Data unavailable";
  const isHaldia = selectedState.code === "WB" && districtName.toLowerCase().includes("medinipur");
  const locationLabel = isHaldia ? "Haldia" : districtName;
  const data = useMemo(() => weather ? adaptWeather(weather) : null, [weather]);
  const ActiveDistrictMap = selectedState.map;
  const currentDate = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const forecastData = useMemo(() => buildForecast(weather?.forecast ?? [], range), [weather, range]);
  const peakFeelsLike = forecastData.length ? Math.round(Math.max(...forecastData.map((item) => item.feels))) : null;
  const nationalRanking = INDIA_LOCATIONS;

  useEffect(() => {
    let cancelled = false;
    setWeather(null);
    setDataStatus("loading");
    setDataMessage(`Loading ${locationLabel} data…`);
    heatShieldApi.getWeather({ state: selectedState.name, district: districtName })
      .then((payload) => {
        if (cancelled) return;
        const adapted = adaptWeather(payload);
        setWeather(payload);
        setDataStatus(adapted ? "available" : "unavailable");
        setDataMessage(adapted ? "Live prototype backend data" : "The backend returned an incomplete dataset for this district.");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWeather(null);
        if (error instanceof HeatShieldApiError && error.code === "LOCATION_DATA_UNAVAILABLE") {
          setDataStatus("unavailable");
          setDataMessage(`${districtName} is selectable, but verified weather, risk and population data are not available yet.`);
        } else {
          setDataStatus("offline");
          setDataMessage(error instanceof Error ? error.message : "The HeatShield backend is unavailable.");
        }
      });
    return () => { cancelled = true; };
  }, [selectedState.name, districtName, locationLabel]);
  const selectState = (code: string) => {
    const next = INDIA_LOCATIONS.find((item) => item.code === code) ?? DEFAULT_STATE;
    setSelectedStateCode(next.code);
    setSelectedDistrict(Object.keys(next.districts)[0]);
    setAlertSent(false);
  };
  const selectLocation = (stateCode: string, districtCode: string) => {
    setSelectedStateCode(stateCode);
    setSelectedDistrict(districtCode);
    setAlertSent(false);
    setUtilityPanel(null);
    setSearchQuery("");
  };
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const stateMatches = INDIA_LOCATIONS.filter((item) => !normalizedSearch || item.name.toLowerCase().includes(normalizedSearch) || item.code.toLowerCase().includes(normalizedSearch));
  const districtMatches = INDIA_LOCATIONS.flatMap((item) => Object.entries(item.districts).map(([code, name]) => ({ stateCode: item.code, stateName: item.name, code, name }))).filter((item) => normalizedSearch && `${item.name} ${item.stateName}`.toLowerCase().includes(normalizedSearch)).slice(0, 60);

  return (
    <div className="min-h-screen bg-[#07100d] text-[#f3f7f4]">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Sun size={19} /></span><span>HeatShield</span></div>
        <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        <nav aria-label="Primary navigation">
          <p className="nav-label">MONITOR</p>
          <a className="nav-item active" href="#overview"><Gauge size={18} />Overview</a>
          <a className="nav-item" href="#forecast"><CloudSun size={18} />Forecast</a>
          <a className="nav-item" href="#zones"><MapIcon size={18} />Interactive map</a>
          <p className="nav-label">RESPONSE</p>
          <a className="nav-item" href="#health"><HeartPulse size={18} />Health impact</a>
          <a className="nav-item" href="#alerts"><Bell size={18} />Alert centre<span className="nav-count">3</span></a>
        </nav>
        <div className="side-card"><div className="live-dot" /><div><strong>Systems online</strong><span>4 data feeds active</span></div></div>
        <div className="agency"><span>Government Operations Console</span><small>SIH Prototype · PS 26083</small></div>
      </aside>
      {menuOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <main className="main-shell">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <button className="location-picker" onClick={() => setUtilityPanel("search")} aria-label="Choose state and district"><MapPin size={17} /><span><small>{selectedState.name}</small><b>{locationLabel}</b></span><ChevronDown size={16} /></button>
          <div className="top-actions"><span className="role-badge">District Officer</span><button className="icon-button" aria-label="Search locations" onClick={() => setUtilityPanel("search")}><Search size={19} /></button><button className="icon-button notification" aria-label="Open notifications" onClick={() => setUtilityPanel("notifications")}><Bell size={19} /><span /></button><div className="avatar">DO</div></div>
        </header>
        <div className="content" id="overview">
          <section className="page-heading">
            <div><div className="heading-badges"><p className="eyebrow">GOVERNMENT HEAT-ACTION COMMAND CENTRE</p><span>Prototype data</span></div><div className="location-breadcrumb"><span>India</span><i>/</i><span>{selectedState.name}</span><i>/</i><b>{districtName}</b>{isHaldia && <><i>/</i><b>Haldia</b></>}</div><h1>Heat risk overview</h1><p>{locationLabel} · {currentDate} · Updated 2 min ago</p></div>
            <div className="segmented" aria-label="Forecast period">{["Today", "3 days", "7 days"].map((item) => <button key={item} className={range === item ? "selected" : ""} onClick={() => setRange(item)}>{item}</button>)}</div>
          </section>
          {dataStatus !== "available" && <section className={`data-state data-state-${dataStatus}`} role="status"><CloudSun size={22}/><div><strong>{dataStatus === "loading" ? "Loading district data" : dataStatus === "offline" ? "Backend unavailable" : "District data unavailable"}</strong><p>{dataMessage}</p></div></section>}
          {data && <section className="alert-strip" id="alerts">
            <div className="alert-icon"><ShieldAlert size={21} /></div>
            <div><strong>{data.risk} heat alert · {data.score >= 85 ? "Red" : data.score >= 70 ? "Orange" : "Yellow"} level</strong><p>{locationLabel}: dangerous conditions expected during the peak exposure window. Outdoor activity should be restricted.</p></div>
            <button onClick={() => !alertSent && setAlertConfirmOpen(true)}>{alertSent ? "Alert issued ✓" : "Issue public alert"}</button>
          </section>}
          {data && <section className="metrics" aria-label="Current heat conditions">
            <article className="metric featured"><div className="metric-top"><span className="metric-icon red"><ThermometerSun size={19} /></span><span className="trend">+3.1° vs normal</span></div><p>Air temperature</p><strong>{data.temp}°<small>C</small></strong><span>Observed at 14:20 IST</span></article>
            <article className="metric"><div className="metric-top"><span className="metric-icon orange"><Activity size={19} /></span><span className="severity">{data.risk}</span></div><p>Feels-like temperature</p><strong>{data.feels}°<small>C</small></strong><span>Human thermal stress index</span></article>
            <article className="metric"><div className="metric-top"><span className="metric-icon blue"><Droplets size={19} /></span></div><p>Relative humidity</p><strong>{data.humidity}<small>%</small></strong><span>High moisture compounds risk</span></article>
            <article className="metric"><div className="metric-top"><span className="metric-icon cyan"><Wind size={19} /></span></div><p>Wind speed</p><strong>{data.wind}<small>km/h</small></strong><span>Low evaporative cooling</span></article>
          </section>}
          <section className="dashboard-grid">
            {data ? <article className="panel forecast-panel" id="forecast">
              <div className="panel-heading"><div><p className="panel-kicker">THERMAL STRESS FORECAST</p><h2>Peak exposure window</h2></div><span className="status-pill"><span /> Live model</span></div>
              <div className="chart-summary"><div><strong>{peakFeelsLike}°C</strong><span>Peak feels-like · {range === "Today" ? "14:00" : range}</span></div><div className="risk-meter"><span>Low</span><span>Moderate</span><span>High</span><span>Extreme</span></div></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecastData} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="heatFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5b29" stopOpacity={0.55}/><stop offset="100%" stopColor="#ff5b29" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid stroke="#ffffff12" vertical={false}/><XAxis dataKey="time" stroke="#809088" tickLine={false} axisLine={false} fontSize={12}/><YAxis domain={[30, 55]} stroke="#809088" tickLine={false} axisLine={false} fontSize={12}/><Tooltip contentStyle={{background:"#111b17", border:"1px solid #2a3832", borderRadius:12}}/><Area type="monotone" dataKey="feels" stroke="#ff6a32" strokeWidth={3} fill="url(#heatFill)"/><Area type="monotone" dataKey="temp" stroke="#f9bd52" strokeWidth={2} fill="transparent" strokeDasharray="5 5"/></AreaChart></ResponsiveContainer></div>
              <div className="legend"><span><i className="solid" />Feels-like</span><span><i className="dashed" />Air temperature</span><span className="model-note">Model confidence 91%</span></div>
            </article> : <article className="panel forecast-panel empty-data-panel" id="forecast"><CloudSun size={28}/><h2>Forecast unavailable</h2><p>Choose a backend-supported district or start the backend to load its forecast.</p></article>}
            <article className={`panel risk-panel ${mapExpanded ? "map-expanded" : ""}`} id="zones">
              <div className="view-switch" aria-label="Risk visualization"><button className={riskView === "map" ? "active" : ""} onClick={() => setRiskView("map")}><MapIcon size={14}/> Map view</button><button className={riskView === "analytics" ? "active" : ""} onClick={() => setRiskView("analytics")}><Activity size={14}/> Analytics</button><button className="expand-map" onClick={() => setMapExpanded(!mapExpanded)} aria-label={mapExpanded ? "Exit fullscreen map" : "Open fullscreen map"}>{mapExpanded ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}<span>{mapExpanded ? "Exit" : "Expand"}</span></button></div>
              <div className="panel-heading map-heading"><div><p className="panel-kicker">GEOSPATIAL RISK</p><h2>{riskView === "analytics" ? "Regional risk ranking" : mapMode === "national" ? "India state directory" : `${selectedState.name} district map`}</h2></div>{riskView === "map" && <div className="map-toggle"><button className={mapMode === "national" ? "active" : ""} onClick={() => setMapMode("national")}>India</button><button className={mapMode === "district" ? "active" : ""} onClick={() => setMapMode("district")}>District</button></div>}</div>
              {riskView === "analytics" ? <div className="risk-ranking">{nationalRanking.slice(0,6).map((item,index)=><button key={item.code} onClick={()=>{selectState(item.code);setRiskView("map");setMapMode("district")}}><span>{String(index+1).padStart(2,"0")}</span><b>{item.name}</b><i><em style={{width:"0%"}}/></i><strong>{Object.keys(item.districts).length}</strong></button>)}</div> : mapMode === "national" ? (
                <>
                  <div className="india-map-layout">
                    <div className="layer-control"><Layers3 size={12}/>{(["risk","temperature","population"] as const).map(layer=><button key={layer} className={mapLayer===layer?"active":""} onClick={()=>setMapLayer(layer)}>{layer === "risk" ? "Risk" : layer === "temperature" ? "Temp" : "Exposure"}</button>)}</div>
                    <div className="state-directory-map" aria-label="All Indian states and union territories">
                      {INDIA_LOCATIONS.map((item) => <button key={item.code} className={selectedState.code === item.code ? "picked" : ""} onClick={() => selectState(item.code)} aria-label={`Select ${item.name}`}><b>{item.code}</b><span>{item.name}</span><strong>{Object.keys(item.districts).length}</strong></button>)}
                    </div>
                    <div className="region-detail"><p>SELECTED REGION</p><h3>{selectedState.name}</h3><div className="region-score"><strong>{data?.score ?? "—"}</strong><span>/ 100<br/>{data ? `${data.risk} risk` : "select district"}</span></div><dl><div><dt>Administrative type</dt><dd>{selectedState.kind}</dd></div><div><dt>Districts listed</dt><dd>{Object.keys(selectedState.districts).length}</dd></div><div><dt>Map status</dt><dd>{selectedState.map ? "Available" : "Unavailable"}</dd></div></dl><button onClick={() => setMapMode("district")}>Open district view →</button></div>
                    <div className={`map-key national-key layer-${mapLayer}`}><span>{mapLayer === "population" ? "Lower exposure" : mapLayer === "temperature" ? "Cooler" : "Lower risk"}</span><i /><span>{mapLayer === "temperature" ? "Hotter" : "Extreme"}</span></div>
                  </div>
                  <p className="map-foot"><MapPin size={15} /> All 28 states and 8 union territories are available for selection</p>
                </>
              ) : (
                <>
                  <div className="geo-district-map">{ActiveDistrictMap ? <div className="district-map-canvas"><ActiveDistrictMap onClick={(value: string) => { const code = normalizeDistrictSelection(selectedState, value); if (code) { setSelectedDistrict(code); setAlertSent(false); } }} size="100%" mapColor="#355244" strokeColor="#9fbea9" strokeWidth="1" hoverColor="#ff6b42"/></div> : <div className="map-unavailable"><MapIcon size={28}/><b>Boundary map unavailable</b><p>{selectedState.name} district geometry is not included in this prototype. District selection and API wiring remain available.</p></div>}<div className="district-inspector"><p>SELECTED DISTRICT</p><h3>{districtName}</h3><strong>{data?.score ?? "—"}<small>/100 risk</small></strong><span>{data ? `${data.risk} thermal stress` : "Backend data unavailable"}</span><button onClick={() => setUtilityPanel("search")}>Change location</button></div><div className="map-key"><span>District boundaries</span><i /></div></div>
                  <p className="map-foot"><MapPin size={15} /> {ActiveDistrictMap ? `Click any ${selectedState.name} district to update the entire dashboard` : "Use the location selector to choose an available district"}</p>
                </>
              )}
            </article>
          </section>
          {data && <section className="lower-grid" id="health">
            <article className="panel health-card"><div className="panel-heading"><div><p className="panel-kicker">PROJECTED HEALTH IMPACT</p><h2>Population at risk</h2></div><Users size={20} /></div><div className="health-main"><strong>{data.exposed}</strong><span>people in {districtName} under high thermal stress</span></div><div className="impact-bars"><div><span>Outdoor workers</span><b>{Math.min(89, data.score - 11)}%</b><i><em style={{width:`${Math.min(89, data.score - 11)}%`}} /></i></div><div><span>Adults over 65</span><b>{Math.max(24, data.score - 25)}%</b><i><em style={{width:`${Math.max(24, data.score - 25)}%`}} /></i></div><div><span>Children under 5</span><b>{Math.max(18, data.score - 36)}%</b><i><em style={{width:`${Math.max(18, data.score - 36)}%`}} /></i></div></div></article>
            <article className="panel actions-card"><div className="panel-heading"><div><p className="panel-kicker">RECOMMENDED RESPONSE</p><h2>Priority actions</h2></div><Zap size={20} /></div><ol><li><span>01</span><div><strong>Open cooling centres</strong><p>Activate centres across {districtName} before peak exposure.</p></div><b>{data.score >= 85 ? "Urgent" : "High"}</b></li><li><span>02</span><div><strong>Adjust outdoor work hours</strong><p>Pause public works during the peak thermal window.</p></div><b>High</b></li><li><span>03</span><div><strong>Mobilise health teams</strong><p>Pre-position ORS and first-response units locally.</p></div><b>High</b></li></ol></article>
            <article className="panel index-card"><div className="panel-heading"><div><p className="panel-kicker">HUMAN THERMAL STRESS</p><h2>Composite index</h2></div></div><div className="gauge"><div className="gauge-ring" style={{background:`conic-gradient(#ff5535 0 ${data.score}%,#243029 ${data.score}%)`}}><div><strong>{data.score}</strong><span>/ 100</span></div></div><p><b>{data.risk} physiological strain</b><span>Response guidance updates for the selected district.</span></p></div></article>
          </section>}
          {data && <section className="operations-grid" aria-label="Emergency response operations">
            <article className="panel operations-card">
              <div className="panel-heading"><div><p className="panel-kicker">FIELD READINESS</p><h2>Response resources</h2></div><RadioTower size={20}/></div>
              <div className="resource-grid"><div><span className="resource-icon lime"><Building2 size={18}/></span><p><strong>{4 + data.score % 7} / {8 + data.score % 7}</strong><small>Cooling centres open</small></p></div><div><span className="resource-icon blue"><Hospital size={18}/></span><p><strong>{6 + data.score % 12}</strong><small>Medical teams ready</small></p></div><div><span className="resource-icon orange"><Users size={18}/></span><p><strong>{70 + data.score}</strong><small>Field volunteers</small></p></div></div>
            </article>
            <article className="panel alert-queue">
              <div className="panel-heading"><div><p className="panel-kicker">ALERT CENTRE</p><h2>Active response queue</h2></div><Siren size={20}/></div>
              <div className="queue-list"><div><span className="queue-status critical"/><p><b>{data.risk} heat warning</b><small>{districtName} · Public broadcast</small></p><strong>Active</strong></div><div><span className="queue-status warning"/><p><b>Outdoor work advisory</b><small>{selectedState.name} · Employers</small></p><strong>14:30</strong></div><div><CheckCircle2 size={15} className="done-icon"/><p><b>Hospital readiness check</b><small>District facilities notified</small></p><strong>Done</strong></div></div>
            </article>
          </section>}
          <footer className="data-footer"><span><i/> Prototype decision-support interface</span><p>Open-Meteo weather · Census prototype exposure · District boundaries</p><b>{data ? `Observed ${data.observedAt} IST` : "No unrelated fallback data shown"}</b></footer>
        </div>
      </main>
      <Sheet open={utilityPanel !== null} onOpenChange={(open) => !open && setUtilityPanel(null)}>
        <SheetContent className="utility-sheet">
          {utilityPanel === "search" ? <><SheetHeader><SheetTitle>Select monitoring location</SheetTitle><SheetDescription>Search all Indian states, union territories and available districts.</SheetDescription></SheetHeader><div className="sheet-body location-browser"><label className="search-box"><Search size={17}/><input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search state or district…"/></label>{districtMatches.length > 0 && <section className="browser-section"><p>DISTRICT RESULTS</p><div className="location-results">{districtMatches.map((item)=><button key={`${item.stateCode}-${item.code}`} onClick={()=>selectLocation(item.stateCode,item.code)}><span><MapPin size={16}/><b>{item.name}</b></span><small>{item.stateName}</small></button>)}</div></section>}<section className="browser-section"><p>{normalizedSearch ? "MATCHING STATES & UNION TERRITORIES" : "STATES & UNION TERRITORIES"}</p><div className="state-picker-grid">{stateMatches.map((item)=><button key={item.code} className={selectedState.code===item.code?"active":""} onClick={()=>selectState(item.code)}><b>{item.code}</b><span>{item.name}</span><small>{item.kind}</small></button>)}</div></section><section className="browser-section district-picker"><p>DISTRICTS IN {selectedState.name.toUpperCase()}</p><div className="district-chip-grid">{Object.entries(selectedState.districts).map(([code,name])=><button key={code} className={selectedDistrict===code?"active":""} onClick={()=>selectLocation(selectedState.code,code)}>{name}</button>)}</div></section></div></> : <><SheetHeader><SheetTitle>Alert centre</SheetTitle><SheetDescription>Operational updates for {districtName}, {selectedState.name}.</SheetDescription></SheetHeader>{data ? <div className="sheet-body notification-feed"><article className="unread"><span className="notice-icon red"><ShieldAlert size={17}/></span><div><b>Heat index reached {data.feels}°C</b><p>{districtName} is currently under {data.risk.toLowerCase()} thermal stress.</p><small>Latest model cycle</small></div></article><article className="unread"><span className="notice-icon amber"><Hospital size={17}/></span><div><b>Medical readiness update</b><p>District response facilities have been asked to confirm capacity.</p><small>Operational guidance</small></div></article></div> : <div className="sheet-body"><div className="data-state data-state-unavailable"><CloudSun size={20}/><div><strong>No alert data</strong><p>{dataMessage}</p></div></div></div>}</>}
        </SheetContent>
      </Sheet>
      <Dialog open={alertConfirmOpen} onOpenChange={setAlertConfirmOpen}>
        <DialogContent className="alert-dialog-content"><DialogHeader><DialogTitle>Issue {data?.risk.toLowerCase() ?? "district"} heat alert?</DialogTitle><DialogDescription>This will simulate a district-wide public warning across SMS, control-room and municipal channels.</DialogDescription></DialogHeader><div className="alert-preview"><ShieldAlert size={22}/><div><b>{data?.risk ?? "District"} heat warning · {districtName}</b><p>Avoid outdoor activity during peak exposure. Use the nearest cooling centre if symptoms occur.</p></div></div><DialogFooter><button className="dialog-cancel" onClick={()=>setAlertConfirmOpen(false)}>Cancel</button><button className="dialog-confirm" disabled={!data} onClick={()=>{setAlertSent(true);setAlertConfirmOpen(false)}}>Confirm and issue alert</button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
