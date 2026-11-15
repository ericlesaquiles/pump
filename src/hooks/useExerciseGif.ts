import { useEffect, useState } from "react";

// Exercise GIFs are optional: they exist only in builds made where `npm run fetch:gifs`
// was run (see scripts/fetch-gifs.ts). Without them, the index fetch fails and nothing shows.
type GifIndex = Record<string, string>;
let index: Promise<GifIndex> | null = null;

function loadIndex(): Promise<GifIndex> {
  index ??= fetch("media/gymvisual/index.json")
    .then((r) => (r.ok ? (r.json() as Promise<GifIndex>) : {}))
    .catch(() => ({}));
  return index;
}

/** URL of the exercise's GIF, or null if there isn't one in this build. */
export function useExerciseGif(exId: string): string | null {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void loadIndex().then((idx) => {
      const file = idx[exId];
      if (live) setSrc(file ? `media/gymvisual/${file}` : null);
    });
    return () => { live = false; };
  }, [exId]);
  return src;
}
