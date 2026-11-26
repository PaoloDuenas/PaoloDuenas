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
// Solve by intensity, then render the same route with source-specific colors.
const displayGrid = createEmptyGrid(grid.width, grid.height);
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
    const sourceOffset = counts.Work && counts.Personal ? 8 : counts.Personal ? 4 : 0;
    setColor(displayGrid, x, y, sourceOffset + level);
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
  const blue = dark ? ["#99e5ff","#53c9fa","#299bd0","#1775ae"] : ["#86cef4","#41ace7","#197eaf","#105d8c"];
  const purple = dark ? ["#e1cdff","#c6a2ff","#ad80f8","#9060dc"] : ["#d2b4fa","#b585ee","#925acf","#753baa"];
  const mixed = blue.map((_, i) => "url(#mixed-" + i + ")");
  const gradients = blue.map((color, i) =>
    '<linearGradient id="mixed-' + i + '"><stop offset="50%" stop-color="' + color +
    '"/><stop offset="50%" stop-color="' + purple[i] + '"/></linearGradient>'
  ).join("");
  const svg = createSvg(displayGrid, cells, chain, {
    colorDots: Object.fromEntries([...blue, ...purple, ...mixed].map((color, i) => [i + 1, color])),
    colorEmpty: dark ? "#161b22" : "#ebedf0",
    colorDotBorder: "#1b1f230a", colorSnake: dark ? "#56e878" : "#229743",
    sizeCell: 16, sizeDot: 12, sizeDotBorderRadius: 2
  }, { stepDurationMs: 100 }).replace("<desc>", "<defs>" + gradients + "</defs><desc>");
  writeFileSync(dark ? "dist/snake-dark.svg" : "dist/snake.svg", svg);
}
console.log("Verified the snake visits all " + active.size + " active days across both calendars.");
