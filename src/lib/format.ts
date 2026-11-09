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

export function fmtDate(s: string): string {
  return parseIsoDate(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function fmtRest(sec: number): string {
  return sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} min` : `${sec} s`;
}

export function fmtClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Weight or set count without trailing zeros. */
export function fmtNum(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function fmtSets(sets: { w: number | null; r: number | null }[]): string {
  return sets.map((x) => `${x.w ? `${fmtNum(x.w)}×` : ""}${x.r ?? "–"}`).join(", ");
}

/** Join class names, skipping falsy ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
