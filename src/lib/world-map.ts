/**
 * Reads the supplied world map (src/assets/shipping/world-map.svg, one path per country with an
 * ISO 3166-1 alpha-2 id) and splits it into the base land and one merged outline per destination
 * region, so the page can colour regions and link them to the table without shipping 1.2 MB of markup.
 */
const sources = import.meta.glob<string>("/src/assets/shipping/world-map.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

const PRECISION = 1;

/** The map uses only relative `m` and `z`; deltas are re-derived from rounded absolute points so rounding never drifts. */
function compact(d: string): string {
  const factor = 10 ** PRECISION;
  const round = (value: number) => Math.round(value * factor) / factor;
  const format = (value: number) => String(Number(value.toFixed(PRECISION)));
  const out: string[] = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let rx = 0;
  let ry = 0;
  let rsx = 0;
  let rsy = 0;
  let opening = true;
  for (const part of d.match(/[mz]|[^mz]+/giu) ?? []) {
    if (part === "z" || part === "Z") {
      out.push("z");
      opening = false;
      x = startX;
      y = startY;
      rx = rsx;
      ry = rsy;
      continue;
    }
    const numbers = part.trim().split(/[\s,]+/u).map(Number);
    for (let i = 0; i + 1 < numbers.length; i += 2) {
      const first = i === 0;
      x += numbers[i];
      y += numbers[i + 1];
      if (first) {
        startX = x;
        startY = y;
      }
      const ax = round(x);
      const ay = round(y);
      // The first point of a path is absolute so concatenated paths do not depend on each other;
      // later subpaths start with a relative `m` from the previous subpath's start.
      const prefix = first ? (opening ? "M" : "m") : opening && i === 2 ? "l" : "";
      out.push(`${prefix}${format(ax - rx)},${format(ay - ry)}`);
      rx = ax;
      ry = ay;
      if (first) {
        rsx = ax;
        rsy = ay;
      }
    }
  }
  return out.join(" ").replace(/ z/gu, "z").replace(/z /gu, "z");
}

export interface WorldMap {
  viewBox: string;
  /** Every country that is not in a highlighted group. */
  land: string;
  groups: Record<string, string>;
}

let cache: WorldMap | undefined;

/** `groups` maps a key to the country ids drawn for it; returns undefined when the file is absent. */
export function buildWorldMap(groups: Record<string, readonly string[]>): WorldMap | undefined {
  if (cache) return cache;
  const source = Object.values(sources)[0];
  if (!source) return undefined;
  const width = /\bwidth="([\d.]+)"/u.exec(source)?.[1];
  const height = /\bheight="([\d.]+)"/u.exec(source)?.[1];
  if (!width || !height) return undefined;
  const wanted = new Map<string, string>();
  for (const [key, ids] of Object.entries(groups)) for (const id of ids) wanted.set(id, key);
  const land: string[] = [];
  const merged: Record<string, string[]> = Object.fromEntries(Object.keys(groups).map((key) => [key, []]));
  for (const match of source.matchAll(/<path\s+d="([^"]*)"[^>]*?\bid="([^"]*)"/gu)) {
    const key = wanted.get(match[2]);
    // Antarctica adds weight and no information here.
    if (match[2] === "AQ") continue;
    (key ? merged[key] : land).push(compact(match[1]));
  }
  cache = {
    viewBox: `0 0 ${width} ${height}`,
    land: land.join(""),
    groups: Object.fromEntries(Object.entries(merged).map(([key, parts]) => [key, parts.join("")])),
  };
  return cache;
}
