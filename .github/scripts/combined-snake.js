import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createEmptyGrid, setColor } from "@snk/types/grid";
import { getHeadX, getHeadY } from "@snk/types/snake";
import { snake4 } from "@snk/types/__fixtures__/snake";
import { getBestRoute } from "@snk/solver/getBestRoute";
import { getPathToPose } from "@snk/solver/getPathToPose";
import { createSvg } from "@snk/svg-creator";

// The public calendar contains only aggregate daily counts from each source.
const calendar = readFileSync("work-personal-commits.svg", "utf8");
const dates = new Map();
for (const match of calendar.matchAll(/<title>(\d{4}-\d{2}-\d{2}) · (Work|Personal) · (\d+) commits<\/title>/g)) {
  const [, date, source, count] = match;
  const day = dates.get(date) ?? {};
  assert(!Object.hasOwn(day, source), "Duplicate daily count");
  day[source] = Number(count);
  dates.set(date, day);
}
assert.equal(dates.size, 365);
const days = [...dates].sort(([a], [b]) => a.localeCompare(b));
const first = new Date(days[0][0] + "T00:00:00Z");
const offset = first.getUTCDay();
const grid = createEmptyGrid(Math.ceil((offset + days.length) / 7), 7);
const active = new Set();
const cells = days.map(([date, counts], index) => {
  assert.equal(Date.parse(date), first.getTime() + index * 86400000);
  assert(Object.hasOwn(counts, "Work") && Object.hasOwn(counts, "Personal"));
  const total = counts.Work + counts.Personal;
  const x = Math.floor((offset + index) / 7);
  const y = (offset + index) % 7;
  if (total) {
    const level = 1 + [2, 5, 10].filter(limit => total >= limit).length;
    setColor(grid, x, y, level);
    active.add(x + "," + y);
  }
  return { x, y };
});

const chain = getBestRoute(grid, snake4);
chain.push(...getPathToPose(chain.at(-1), snake4));
const visited = new Set(chain.map(pose => getHeadX(pose) + "," + getHeadY(pose)));
for (const point of active) assert(visited.has(point), "Missed an active day");
mkdirSync("dist", { recursive: true });
for (const dark of [false, true]) {
  const colors = dark ? ["#01311f","#034525","#0f6d31","#00c647"] : ["#9be9a8","#40c463","#30a14e","#216e39"];
  const svg = createSvg(grid, cells, chain, {
    colorDots: Object.fromEntries(colors.map((color, i) => [i + 1, color])),
    colorEmpty: dark ? "#161b22" : "#ebedf0",
    colorDotBorder: "#1b1f230a", colorSnake: dark ? "#b393f4" : "#9366da",
    sizeCell: 16, sizeDot: 12, sizeDotBorderRadius: 2
  }, { stepDurationMs: 100 });
  writeFileSync(dark ? "dist/snake-dark.svg" : "dist/snake.svg", svg);
}
console.log("Verified the snake visits all " + active.size + " active days across both calendars.");
