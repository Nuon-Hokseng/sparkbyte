"use client";

import { useState } from "react";
import { Bars, Legend, LineChart } from "./charts";
import { PANEL, useScript, type DemoProps } from "./kit";
import {
  BY_GENDER,
  CATEGORIES,
  CLIENTS,
  COLOR,
  DAILY,
  DATES,
  ITEMS,
  REVENUE,
  usd,
  type CategoryId,
} from "./sales";

// The charts to choose between: the name on each one's button, and its title.
const VIEWS = [
  { id: "revenue", tab: "Revenue", title: "Revenue Trend" },
  { id: "categories", tab: "Categories", title: "Product Category Sales Over Time" },
  { id: "items", tab: "Top items", title: "Top Selling Items (by Quantity Sold)" },
  { id: "gender", tab: "Gender", title: "Sales Revenue by Gender & Specific Product" },
  { id: "clients", tab: "Clients", title: "Top Clients" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const [FEMALE, MALE] = [COLOR.frame, COLOR.lens];
/** A scale's rules: nothing, the top, and the quarters between. */
const quarters = (max: number) => [0, 0.25, 0.5, 0.75, 1].map((q) => q * max);
const count = (n: number) => String(n);

/**
 * The POS's Data screen: the month's sales as whichever chart answers the
 * question. It shows three of them in turn, then is the visitor's to switch,
 * filter and read values off.
 */
export function Analytics({ play }: DemoProps) {
  const [view, setView] = useState<View>("revenue");
  const [filter, setFilter] = useState<CategoryId | "all">("all");

  const stop = useScript(play, () => [
    [2600, () => setView("items")],
    [2300, () => setView("clients")],
  ]);

  const { title } = VIEWS.find((v) => v.id === view)!;

  return (
    <div
      onPointerDown={stop}
      className={`relative flex size-full flex-col gap-[1em] bg-mock-fog p-[1.3em] @max-xl:p-[1em] ${PANEL}`}
    >
      <div className="flex items-center justify-between gap-[1em]">
        <p className="text-[1.25em] font-semibold leading-none @max-xl:hidden">
          Data
        </p>
        <div className="flex rounded-[0.6em] border border-mock-line bg-mock-card p-[0.2em] @max-xl:w-full">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={v.id === view}
              onClick={() => {
                stop();
                setView(v.id);
              }}
              className={`rounded-[0.45em] px-[0.9em] py-[0.55em] text-[0.76em] font-semibold leading-none transition-colors @max-xl:flex-1 @max-xl:px-0 ${
                v.id === view
                  ? "bg-mock-accent text-mock-inverse"
                  : "text-mock-mute hover:text-mock-ink"
              }`}
            >
              {v.tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[0.9em] border border-mock-line bg-mock-card p-[1.1em] @max-xl:p-[0.9em]">
        <div className="flex flex-wrap items-center justify-between gap-x-[1em] gap-y-[0.6em] pb-[0.9em]">
          <p className="text-[0.95em] font-semibold leading-tight">{title}</p>
          {view === "items" && (
            <div className="flex gap-[0.35em]">
              {[{ id: "all", name: "All" } as const, ...CATEGORIES].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={c.id === filter}
                  onClick={() => setFilter(c.id)}
                  className={`rounded-[0.5em] px-[0.8em] py-[0.5em] text-[0.68em] font-semibold leading-none transition-colors ${
                    c.id === filter
                      ? "bg-[#121212] text-white"
                      : "bg-[#f0f0f0] text-mock-mute hover:text-mock-ink"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
          {view === "clients" && (
            <p className="text-[0.7em] leading-none text-mock-mute">
              Ranked by frames and lenses bought, all time
            </p>
          )}
        </div>

        {/* Remounting draws the chart afresh: for each one, and each filter. */}
        <div key={`${view}-${filter}`} className="flex min-h-0 flex-1 flex-col">
          {view === "revenue" && (
            <LineChart
              series={[{ name: "Revenue", color: COLOR.frame, values: REVENUE }]}
              labels={DATES}
              max={2000}
              ticks={quarters(2000)}
              format={usd}
            />
          )}
          {view === "categories" && (
            <>
              <LineChart
                series={CATEGORIES.map((c) => ({
                  name: c.name,
                  color: c.color,
                  values: DAILY[c.id],
                }))}
                labels={DATES}
                max={1200}
                ticks={quarters(1200)}
                format={usd}
              />
              <Legend items={[...CATEGORIES]} />
            </>
          )}
          {view === "items" && <TopItems filter={filter} />}
          {view === "gender" && (
            <>
              <Bars
                rows={BY_GENDER.map((p) => ({
                  label: p.name,
                  bars: [
                    { name: "Male", value: p.male, color: MALE },
                    { name: "Female", value: p.female, color: FEMALE },
                  ],
                }))}
                max={2200}
                ticks={quarters(2200)}
                format={usd}
              />
              <Legend
                items={[
                  { name: "Female", color: FEMALE },
                  { name: "Male", color: MALE },
                ]}
              />
            </>
          )}
          {view === "clients" && <TopClients />}
        </div>
      </div>

      {/* The button that opens the assistant, as it floats over this screen. */}
      <span
        aria-hidden="true"
        className="absolute bottom-[0.8em] right-[0.8em] grid size-[3em] place-items-center rounded-full bg-mock-accent text-mock-inverse shadow-[0_0.5em_1.2em_-0.3em_rgba(238,24,144,0.6)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[1.4em]"
        >
          <path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20 11.5z" />
        </svg>
      </span>
    </div>
  );
}

function TopItems({ filter }: { filter: CategoryId | "all" }) {
  const items = ITEMS.filter(
    (item) => filter === "all" || item.category === filter,
  ).slice(0, 8);
  // The scale is the first of these that takes the longest bar.
  const most = Math.max(...items.map((item) => item.sold));
  const max = [8, 20, 40, 100].find((top) => top >= most) ?? most;

  return (
    <>
      <Bars
        rows={items.map((item) => ({
          label: item.name,
          bars: [{ value: item.sold, color: COLOR[item.category] }],
        }))}
        max={max}
        ticks={quarters(max)}
        format={count}
        counted
      />
      <Legend items={[...CATEGORIES]} />
    </>
  );
}

const GLOW = "bg-linear-to-br from-[#64c1fa] to-[#b884fe] text-white";
// The podium: second, first and third, left to right, and how tall each
// one's step is.
const PODIUM = [
  { place: 2, step: "h-[3.4em]" },
  { place: 1, step: "h-[5em]" },
  { place: 3, step: "h-[2.4em]" },
];

function TopClients() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[0.6em]">
      <div className="flex items-end justify-center gap-[0.7em] pt-[1.2em]">
        {PODIUM.map(({ place, step }, i) => {
          const client = CLIENTS[place - 1];
          return (
            <div
              key={place}
              style={{ animationDelay: `${i * 90}ms` }}
              className="relative w-[9em] animate-[mock-in_0.45s_ease-out_backwards]"
            >
              {place === 1 && (
                <svg
                  viewBox="0 0 24 16"
                  aria-hidden="true"
                  className="absolute -top-[1.2em] left-1/2 h-[0.9em] -translate-x-1/2 fill-[#e49e0b]"
                >
                  <path d="M2 13L1 3l6 4 5-6 5 6 6-4-1 10zM2 14.5h20V16H2z" />
                </svg>
              )}
              <div
                className={`rounded-[0.7em] px-[0.6em] py-[0.7em] text-center shadow-[0_0_1em_rgba(100,193,250,0.55)] ${GLOW}`}
              >
                <p aria-hidden="true" className="text-[0.6em] leading-none tracking-[0.2em]">
                  ★★★★
                </p>
                <p className="mt-[0.5em] text-[0.8em] font-bold leading-none">
                  {client.name}
                </p>
                <p className="mt-[0.45em] text-[1.3em] font-bold leading-none tabular-nums">
                  {client.items}
                </p>
                <p className="mt-[0.35em] text-[0.56em] leading-none text-white/80">
                  frames &amp; lenses
                </p>
              </div>
              <div
                className={`mt-[0.4em] grid place-items-center rounded-t-[0.7em] ${step} ${GLOW}`}
              >
                <span className="text-[1.1em] font-bold leading-none">
                  #{place}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-[0.45em] overflow-hidden">
        {CLIENTS.slice(3).map((client, i) => (
          <li
            key={client.name}
            style={{ animationDelay: `${300 + i * 80}ms` }}
            className="flex animate-[mock-in_0.4s_ease-out_backwards] items-center gap-[0.9em] rounded-[0.6em] border border-mock-line px-[0.9em] py-[0.55em]"
          >
            <span className="text-[0.8em] font-bold leading-none text-mock-mute">
              #{i + 4}
            </span>
            <span className="min-w-0 flex-1 leading-none">
              <span className="block text-[0.8em] font-semibold">{client.name}</span>
              <span className="mt-[0.35em] block text-[0.62em] text-mock-mute">
                {client.visits} visits
              </span>
            </span>
            <span className="text-right leading-none">
              <span className="block text-[0.85em] font-bold tabular-nums">
                {client.items}
              </span>
              <span className="mt-[0.3em] block text-[0.56em] text-mock-mute">
                items
              </span>
            </span>
            <span
              className={`rounded-full border px-[0.8em] py-[0.4em] text-[0.6em] font-bold leading-none ${
                client.tier === "Diamond"
                  ? "border-[#64c1fa] bg-linear-to-r from-[#d9f4fe] to-[#e3dcff] text-[#367592]"
                  : "border-[#e99f00] bg-[#fefbea] text-[#8a430e]"
              }`}
            >
              {client.tier === "Gold" && (
                <span aria-hidden="true" className="text-[#e99f00]">
                  ★★★{" "}
                </span>
              )}
              {client.tier}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
