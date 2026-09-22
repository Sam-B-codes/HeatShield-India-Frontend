import type { ComponentType } from "react";
import {
  AndhrapradeshDistrictNames, AndhrapradeshMap,
  ArunachalpradeshDistrictNames, ArunachalpradeshMap,
  AssamDistrictNames, AssamMap,
  BiharDistrictNames, BiharMap,
  ChhattisgarhDistrictNames, ChhattisgarhMap,
  GoaDistrictNames, GoaMap,
  GujaratDistrictNames, GujaratMap,
  HaryanaDistrictNames, HaryanaMap,
  HimachalpradeshDistrictNames, HimachalpradeshMap,
  JharkhandDistrictNames, JharkhandMap,
  KarnatakaDistrictNames, KarnatakaMap,
  KashmirDistrictNames, KashmirMap,
  KeralaDistrictNames, KeralaMap,
  LadakhDistrictNames, LadakhMap,
  MadhyapradeshDistrictNames, MadhyapradeshMap,
  MaharashtraDistrictNames, MaharashtraMap,
  ManipurDistrictNames, ManipurMap,
  MeghalayaDistrictNames, MeghalayaMap,
  MizoramDistrictNames, MizoramMap,
  NagalandDistrictNames, NagalandMap,
  OdishaDistrictNames, OdishaMap,
  PunjabDistrictNames, PunjabMap,
  RajasthanDistrictNames, RajasthanMap,
  SikkimDistrictNames, SikkimMap,
  TamilnaduDistrictNames, TamilnaduMap,
  TelanganaDistrictNames, TelanganaMap,
  TripuraDistrictNames, TripuraMap,
  UttarakhandDistrictNames, UttarakhandMap,
  UttarpradeshDistrictNames, UttarpradeshMap,
  WestbengalDistrictNames, WestbengalMap,
} from "svgmap-india";

export type DistrictMapProps = {
  onClick: (value: string) => void;
  size?: string;
  mapColor?: string;
  strokeColor?: string;
  strokeWidth?: string;
  hoverColor?: string;
};

export type StateEntry = {
  name: string;
  code: string;
  kind: "State" | "Union Territory";
  map?: ComponentType<DistrictMapProps>;
  districts: Record<string, string>;
};

const oneDistrict = (name: string) => ({ ALL: name });

export const INDIA_LOCATIONS: StateEntry[] = [
  { name: "Andhra Pradesh", code: "AP", kind: "State", map: AndhrapradeshMap, districts: AndhrapradeshDistrictNames },
  { name: "Arunachal Pradesh", code: "AR", kind: "State", map: ArunachalpradeshMap, districts: ArunachalpradeshDistrictNames },
  { name: "Assam", code: "AS", kind: "State", map: AssamMap, districts: AssamDistrictNames },
  { name: "Bihar", code: "BR", kind: "State", map: BiharMap, districts: BiharDistrictNames },
  { name: "Chhattisgarh", code: "CG", kind: "State", map: ChhattisgarhMap, districts: ChhattisgarhDistrictNames },
  { name: "Goa", code: "GA", kind: "State", map: GoaMap, districts: GoaDistrictNames },
  { name: "Gujarat", code: "GJ", kind: "State", map: GujaratMap, districts: GujaratDistrictNames },
  { name: "Haryana", code: "HR", kind: "State", map: HaryanaMap, districts: HaryanaDistrictNames },
  { name: "Himachal Pradesh", code: "HP", kind: "State", map: HimachalpradeshMap, districts: HimachalpradeshDistrictNames },
  { name: "Jharkhand", code: "JH", kind: "State", map: JharkhandMap, districts: JharkhandDistrictNames },
  { name: "Karnataka", code: "KA", kind: "State", map: KarnatakaMap, districts: KarnatakaDistrictNames },
  { name: "Kerala", code: "KL", kind: "State", map: KeralaMap, districts: KeralaDistrictNames },
  { name: "Madhya Pradesh", code: "MP", kind: "State", map: MadhyapradeshMap, districts: MadhyapradeshDistrictNames },
  { name: "Maharashtra", code: "MH", kind: "State", map: MaharashtraMap, districts: MaharashtraDistrictNames },
  { name: "Manipur", code: "MN", kind: "State", map: ManipurMap, districts: ManipurDistrictNames },
  { name: "Meghalaya", code: "ML", kind: "State", map: MeghalayaMap, districts: MeghalayaDistrictNames },
  { name: "Mizoram", code: "MZ", kind: "State", map: MizoramMap, districts: MizoramDistrictNames },
  { name: "Nagaland", code: "NL", kind: "State", map: NagalandMap, districts: NagalandDistrictNames },
  { name: "Odisha", code: "OD", kind: "State", map: OdishaMap, districts: OdishaDistrictNames },
  { name: "Punjab", code: "PB", kind: "State", map: PunjabMap, districts: PunjabDistrictNames },
  { name: "Rajasthan", code: "RJ", kind: "State", map: RajasthanMap, districts: RajasthanDistrictNames },
  { name: "Sikkim", code: "SK", kind: "State", map: SikkimMap, districts: SikkimDistrictNames },
  { name: "Tamil Nadu", code: "TN", kind: "State", map: TamilnaduMap, districts: TamilnaduDistrictNames },
  { name: "Telangana", code: "TS", kind: "State", map: TelanganaMap, districts: TelanganaDistrictNames },
  { name: "Tripura", code: "TR", kind: "State", map: TripuraMap, districts: TripuraDistrictNames },
  { name: "Uttar Pradesh", code: "UP", kind: "State", map: UttarpradeshMap, districts: UttarpradeshDistrictNames },
  { name: "Uttarakhand", code: "UK", kind: "State", map: UttarakhandMap, districts: UttarakhandDistrictNames },
  { name: "West Bengal", code: "WB", kind: "State", map: WestbengalMap, districts: WestbengalDistrictNames },
  { name: "Andaman and Nicobar Islands", code: "AN", kind: "Union Territory", districts: { NIC: "Nicobar", NMA: "North and Middle Andaman", SAN: "South Andaman" } },
  { name: "Chandigarh", code: "CH", kind: "Union Territory", districts: oneDistrict("Chandigarh") },
  { name: "Dadra and Nagar Haveli and Daman and Diu", code: "DH", kind: "Union Territory", districts: { DNH: "Dadra and Nagar Haveli", DAM: "Daman", DIU: "Diu" } },
  { name: "Delhi", code: "DL", kind: "Union Territory", districts: { CEN: "Central Delhi", EAS: "East Delhi", NDE: "New Delhi", NOR: "North Delhi", NEA: "North East Delhi", NWE: "North West Delhi", SHA: "Shahdara", SOU: "South Delhi", SEA: "South East Delhi", SWE: "South West Delhi", WES: "West Delhi" } },
  { name: "Jammu and Kashmir", code: "JK", kind: "Union Territory", map: KashmirMap, districts: KashmirDistrictNames },
  { name: "Ladakh", code: "LA", kind: "Union Territory", map: LadakhMap, districts: LadakhDistrictNames },
  { name: "Lakshadweep", code: "LD", kind: "Union Territory", districts: oneDistrict("Lakshadweep") },
  { name: "Puducherry", code: "PY", kind: "Union Territory", districts: { KAR: "Karaikal", MAH: "Mahe", PUD: "Puducherry", YAN: "Yanam" } },
];

export const findDistrictCode = (state: StateEntry, districtName: string) =>
  Object.entries(state.districts).find(([, name]) => name.toLowerCase() === districtName.toLowerCase())?.[0]
  ?? Object.entries(state.districts).find(([, name]) => name.toLowerCase().includes(districtName.toLowerCase()))?.[0]
  ?? Object.keys(state.districts)[0];

export function normalizeDistrictSelection(state: StateEntry, value: string) {
  const raw = String(value ?? "").trim();
  if (state.districts[raw]) return raw;

  const caseInsensitiveCode = Object.keys(state.districts).find(
    (code) => code.toLowerCase() === raw.toLowerCase(),
  );
  if (caseInsensitiveCode) return caseInsensitiveCode;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const nameMatch = Object.entries(state.districts).find(([, name]) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized,
  );
  return nameMatch?.[0] ?? null;
}

export function buildDistrictData(state: string, district: string) {
  const seed = [...`${state}-${district}`].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const temp = Number((33 + (seed % 115) / 10).toFixed(1));
  const humidity = 38 + (seed % 47);
  const wind = 6 + (seed % 13);
  const feels = Math.round(temp + Math.max(3, humidity / 13));
  const score = Math.min(96, Math.round(42 + (temp - 32) * 3.1 + humidity / 5));
  const risk = score >= 85 ? "Extreme" : score >= 70 ? "High" : score >= 55 ? "Moderate" : "Low";
  const exposed = `${(0.8 + (seed % 38) / 10).toFixed(1)}L`;
  return { temp, humidity, wind, feels, score, risk, exposed };
}
