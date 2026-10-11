"use client";

import { useState } from "react";
import type { PointerEvent } from "react";

// The charts of the POS's Data screen, drawn the way the product draws them:
// thin smooth lines with a ring at each point, rounded bars, dashed grid.
// Like the rest of a demo they are sized in em. A plot stretches to whatever
// box it is given, so its lines are drawn on a 100 × 100 grid that stretches
// with it, and everything that must keep its shape (points, labels) is HTML
// laid over that.

export type Series = { name: string; color: string; values: number[] };

const AXIS = "border-[#9c9c9c]";
const GRID = "border-dashed border-[#e4e4e4]";
const LABEL = "text-[0.62em] leading-none text-mock-mute tabular-nums";

const pct = (v: number) => `${v}%`;

/** A smooth line through the points that never swings past them. */
function smooth(points: [x: number, y: number][]) {
  const n = points.length;
  const slope = (i: number) =>
    (points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]);
  // The line's slope at each point: none at a peak or a dip, and elsewhere
  // no steeper than either side allows.
  const at = points.map((_, i) => {
    if (i === 0 || i === n - 1) return 0;
    const before = slope(i - 1);
    const after = slope(i);
    return (
      (Math.sign(before) + Math.sign(after)) *
        Math.min(
          Math.abs(before),
          Math.abs(after),
          Math.abs(before + after) / 4,
        ) || 0
    );
  });
  at[0] = (3 * slope(0) - at[1]) / 2;
  at[n - 1] = (3 * slope(n - 2) - at[n - 2]) / 2;

  const f = (v: number) => v.toFixed(2);
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    d += `C${f(x0 + third)} ${f(y0 + third * at[i])} ${f(x1 - third)} ${f(
      y1 - third * at[i + 1],
    )} ${f(x1)} ${f(y1)}`;
  }
  return d;
}

/** What each colour of a chart stands for. */
export function Legend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-x-[1.2em] gap-y-[0.3em] pt-[0.7em] text-[0.68em] leading-none text-mock-mute">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-[0.45em]">
          <span
            style={{ background: item.color }}
            className="size-[0.8em] rounded-[0.2em]"
          />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

/**
 * One line for each of `series` over the same days, on a scale from nothing
 * to `max`, with a rule at each of `ticks`. Every `every`th day is named along
 * the bottom. Pointing at the plot, or touching it, reads off that day.
 */
export function LineChart({
  series,
  labels,
  max,
  ticks,
  every = 2,
  format,
}: {
  series: Series[];
  labels: string[];
  max: number;
  ticks: number[];
  every?: number;
  format: (value: number) => string;
}) {
  const [day, setDay] = useState<number | null>(null);
  const last = labels.length - 1;
  const x = (i: number) => (i / last) * 100;
  const y = (value: number) => 100 - (value / max) * 100;

  const point = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - box.left) / box.width) * last);
    setDay(Math.min(last, Math.max(0, i)));
  };

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <div className="relative w-[3.3em] shrink-0">
          {ticks.map((tick) => (
            <span
              key={tick}
              style={{ top: pct(y(tick)) }}
              className={`absolute right-[0.9em] -translate-y-1/2 ${LABEL}`}
            >
              {format(tick)}
            </span>
          ))}
        </div>

        <div
          onPointerMove={point}
          onPointerDown={point}
          onPointerLeave={() => setDay(null)}
          className={`relative min-w-0 flex-1 border-b border-l ${AXIS}`}
        >
          {ticks.slice(1).map((tick) => (
            <span
              key={tick}
              style={{ top: pct(y(tick)) }}
              className={`absolute inset-x-0 border-t ${GRID}`}
            />
          ))}
          {labels.map(
            (_, i) =>
              i > 0 &&
              i % every === 0 && (
                <span
                  key={i}
                  style={{ left: pct(x(i)) }}
                  className={`absolute inset-y-0 border-l ${GRID}`}
                />
              ),
          )}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            {series.map((s) => (
              <path
                key={s.name}
                d={smooth(s.values.map((v, i) => [x(i), y(v)]))}
                fill="none"
                stroke={s.color}
                strokeWidth="1.6"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {series.map((s) =>
            s.values.map((v, i) => (
              <span
                key={`${s.name}-${i}`}
                style={{ left: pct(x(i)), top: pct(y(v)), borderColor: s.color }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.1em] bg-mock-card ${
                  i === day ? "size-[0.75em]" : "size-[0.45em]"
                }`}
              />
            )),
          )}

          {/* The chart is drawn from left to right as this draws aside. */}
          <span className="pointer-events-none absolute -inset-y-[0.4em] -right-[0.4em] left-px origin-right scale-x-0 animate-[chart-wipe_0.9s_ease-out] bg-mock-card" />

          {day !== null && (
            <>
              <span
                style={{ left: pct(x(day)) }}
                className="pointer-events-none absolute inset-y-0 border-l border-mock-mute"
              />
              <div
                style={{ left: pct(x(day)) }}
                className={`pointer-events-none absolute top-[0.4em] z-10 rounded-[0.5em] border border-mock-line bg-mock-card px-[0.7em] py-[0.55em] shadow-[0_0.4em_1em_-0.4em_rgba(19,24,39,0.35)] ${
                  day > last / 2
                    ? "-translate-x-[calc(100%+0.6em)]"
                    : "translate-x-[0.6em]"
                }`}
              >
                <p className="text-[0.66em] font-semibold leading-none">
                  {labels[day]}
                </p>
                {series.map((s) => (
                  <p
                    key={s.name}
                    className="mt-[0.5em] flex items-center gap-[0.5em] whitespace-nowrap text-[0.66em] leading-none"
                  >
                    <span
                      style={{ background: s.color }}
                      className="size-[0.7em] rounded-full"
                    />
                    <span className="text-mock-mute">{s.name}</span>
                    <span className="ml-auto pl-[0.8em] font-semibold tabular-nums">
                      {format(s.values[day])}
                    </span>
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* The days, written at a slant so that they fit side by side. */}
      <div className="relative ml-[3.3em] h-[2.4em] shrink-0">
        {labels.map(
          (label, i) =>
            i % every === 0 && (
              <span
                key={label}
                style={{ right: pct(100 - x(i)) }}
                className={`absolute top-[0.5em] origin-top-right -rotate-45 ${LABEL} ${
                  i % (every * 2) ? "@max-xl:hidden" : ""
                }`}
              >
                {label}
              </span>
            ),
        )}
      </div>
    </div>
  );
}

export type BarRow = {
  label: string;
  bars: { name?: string; value: number; color: string }[];
};

/**
 * A bar, or a group of them, for each of `rows`, running rightwards on a scale
 * from nothing to `max` with a rule at each of `ticks`. With `counted`, each
 * bar has its value written at its end.
 */
export function Bars({
  rows,
  max,
  ticks,
  format,
  counted = false,
}: {
  rows: BarRow[];
  max: number;
  ticks: number[];
  format: (value: number) => string;
  counted?: boolean;
}) {
  // The names take a column of this width, and the plot the rest but for a
  // margin, where the longest bar's value is written.
  const plot = "absolute inset-y-0 left-[9.5em] right-[2.2em]";

  return (
    <div className="flex size-full min-h-0 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col justify-around">
        <div className={`${plot} border-b border-l ${AXIS}`}>
          {ticks.slice(1).map((tick) => (
            <span
              key={tick}
              style={{ left: pct((tick / max) * 100) }}
              className={`absolute inset-y-0 border-l ${GRID}`}
            />
          ))}
        </div>

        {rows.map((row, r) => (
          <div key={row.label} className="relative flex min-h-0 flex-1 items-center">
            <span className="w-[9.5em] shrink-0 pr-[0.7em] text-right leading-none text-mock-mute">
              <span className="block truncate text-[0.68em]">{row.label}</span>
            </span>
            <div className="mr-[2.2em] flex h-full min-w-0 flex-1 flex-col justify-center gap-[0.12em] py-[0.18em]">
              {row.bars.map((bar) => (
                <div
                  key={bar.name ?? row.label}
                  className="flex min-h-0 flex-1 items-center"
                  style={{ maxHeight: row.bars.length > 1 ? "0.7em" : "1.5em" }}
                >
                  <span
                    title={`${row.label}${bar.name ? `, ${bar.name}` : ""}: ${format(bar.value)}`}
                    style={{
                      width: pct((bar.value / max) * 100),
                      background: bar.color,
                      animationDelay: `${r * 40}ms`,
                    }}
                    className="h-full origin-left animate-[bar-in_0.6s_cubic-bezier(0.2,0.7,0.2,1)_backwards] rounded-[0.3em]"
                  />
                  {counted && (
                    <span className="pl-[0.5em] text-[0.66em] font-semibold leading-none tabular-nums">
                      {format(bar.value)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative ml-[9.5em] mr-[2.2em] h-[1.5em] shrink-0">
        {ticks.map((tick) => (
          <span
            key={tick}
            style={{ left: pct((tick / max) * 100) }}
            className={`absolute top-[0.6em] -translate-x-1/2 ${LABEL}`}
          >
            {format(tick)}
          </span>
        ))}
      </div>
    </div>
  );
}
