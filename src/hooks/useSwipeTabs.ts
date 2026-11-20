import { useEffect } from "react";
import type { Route } from "./useRoute.ts";

/** Tab order for swiping, as in the top bar. */
export const TAB_ORDER: Route[] = ["plan", "log", "history", "settings"];

const MIN_DISTANCE = 70; // px sideways
const MAX_DURATION = 700; // ms
const SIDEWAYS_RATIO = 1.8; // sideways must clearly beat up/down, so scrolling isn't a swipe
// Android's back gesture starts at the screen edges; leave those to the system.
const EDGE = 24;

/** Where a swipe should not switch tabs: dialogs, form fields, and anything marked data-no-swipe. */
const IGNORE = "dialog, input, textarea, select, [data-no-swipe]";

/** The tab to the left or right of `route`, or null at either end. */
export function neighbourTab(route: Route, dir: 1 | -1): Route | null {
  const i = TAB_ORDER.indexOf(route);
  if (i < 0) return null;
  return TAB_ORDER[i + dir] ?? null;
}

/** Swipe left/right anywhere on the page to move to the next/previous tab. */
export function useSwipeTabs(route: Route, enabled: boolean): void {
  useEffect(() => {
    // The whole page, not just the content: short screens leave empty space below it.
    const node = document;
    if (!enabled) return;
    let start: { x: number; y: number; at: number } | null = null;

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const target = e.target instanceof Element ? e.target : null;
      if (e.touches.length !== 1 || !touch || target?.closest(IGNORE) || document.querySelector("dialog[open]")
        || touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE) {
        start = null;
        return;
      }
      start = { x: touch.clientX, y: touch.clientY, at: Date.now() };
    };

    const onEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const quick = Date.now() - start.at <= MAX_DURATION;
      start = null;
      if (!quick || Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SIDEWAYS_RATIO) return;
      // Finger moving left reveals the tab on the right.
      const next = neighbourTab(route, dx < 0 ? 1 : -1);
      if (next) window.location.hash = `#${next}`;
    };

    const onCancel = () => { start = null; };
    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchend", onEnd, { passive: true });
    node.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onCancel);
    };
  }, [route, enabled]);
}
