// Small display helpers shared by components.

/** Local date as YYYY-MM-DD. */
export function isoDate(d: Date): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function parseIsoDate(s: string): Date {
  const [y = 1970, m = 1, d = 1] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(s: string, locale?: string): string {
  return parseIsoDate(s).toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
}

export function fmtRest(sec: number): string {
  return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} min` : `${sec} s`;
}

export function fmtClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Weight or set count without trailing zeros (and with a decimal comma in Portuguese). */
export function fmtNum(n: number, locale?: string): string {
  const r = Math.round(n * 100) / 100;
  return locale ? r.toLocaleString(locale, { maximumFractionDigits: 2, useGrouping: false }) : String(r);
}

export function fmtSets(sets: { w: number | null; r: number | null }[], locale?: string): string {
  return sets.map((x) => `${x.w ? `${fmtNum(x.w, locale)}×` : ""}${x.r ?? "–"}`).join(locale?.startsWith("pt") ? "; " : ", ");
}

/** Join class names, skipping falsy ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
