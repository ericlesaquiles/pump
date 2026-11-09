import { useEffect, useState } from "react";

export type Route = "setup" | "plan" | "log" | "history" | "settings";
const ROUTES: Route[] = ["setup", "plan", "log", "history", "settings"];

function read(): Route | null {
  const h = window.location.hash.slice(1);
  return (ROUTES as string[]).includes(h) ? (h as Route) : null;
}

/** Hash-based routing (#plan, #log …), so the app works from any static host and offline. */
export function useRoute(): [Route | null, (r: Route) => void] {
  const [route, setRoute] = useState<Route | null>(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return [route, (r) => { window.location.hash = `#${r}`; }];
}
