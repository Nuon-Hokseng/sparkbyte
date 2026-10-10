"use client";

import { useState } from "react";
import { PANEL, useScript, type DemoProps } from "./kit";

type Table = { id: number; floor: number; seats: number };

const FLOORS = [0, 1, 2];
const SIZES = [
  { name: "Solo", seats: 1 },
  { name: "Couple", seats: 2 },
  { name: "Family", seats: 4 },
];
const MAX_SEATS = 8;
const MAX_BATCH = 4;
const START: Table[] = [
  { id: 1, floor: 0, seats: 2 },
  { id: 2, floor: 0, seats: 2 },
  { id: 3, floor: 0, seats: 1 },
  { id: 4, floor: 0, seats: 2 },
  { id: 5, floor: 1, seats: 4 },
  { id: 6, floor: 1, seats: 6 },
  { id: 7, floor: 1, seats: 2 },
];

const LABEL =
  "block text-[0.7em] font-semibold uppercase tracking-[0.06em] text-mock-mute";
const ROUND =
  "grid size-[1.9em] shrink-0 place-items-center rounded-[0.45em] bg-mock-fog font-semibold leading-none text-mock-ink transition-colors hover:bg-mock-line disabled:opacity-35";

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

const party = (seats: number) =>
  seats === 1 ? "Solo" : seats === 2 ? "Couple" : seats < 6 ? "Family" : "Group";

/**
 * Settings → Restaurant tables: add tables to a floor in batches of one size,
 * then adjust the seats at any of them.
 */
export function TableSizes({ play }: DemoProps) {
  const [tables, setTables] = useState(START);
  const [floor, setFloor] = useState(0);
  const [size, setSize] = useState(1);
  const [batch, setBatch] = useState(2);

  const resize = (id: number, by: number) =>
    setTables((all) =>
      all.map((t) =>
        t.id === id ? { ...t, seats: clamp(t.seats + by, 1, MAX_SEATS) } : t,
      ),
    );

  const addTables = (count: number, seats: number, to: number) =>
    setTables((all) => {
      const from = Math.max(0, ...all.map((t) => t.id)) + 1;
      return [
        ...all,
        ...Array.from({ length: count }, (_, i) => ({
          id: from + i,
          floor: to,
          seats,
        })),
      ];
    });

  const stop = useScript(play, () => [
    [900, () => resize(2, 1)],
    [450, () => resize(2, 1)],
    [900, () => setSize(2)],
    [600, () => addTables(2, SIZES[2].seats, 0)],
  ]);

  const here = tables.filter((t) => t.floor === floor);

  return (
    <div
      className={`flex size-full flex-col bg-mock-card p-[1.5em] @max-xl:p-[1.2em] ${PANEL}`}
    >
      <div className="flex flex-wrap items-end gap-x-[1.4em] gap-y-[0.8em] rounded-[0.9em] bg-mock-fog p-[1em]">
        <div>
          <span className={LABEL}>People at each table</span>
          <div className="mt-[0.45em] flex rounded-[0.6em] border border-mock-line bg-mock-card p-[0.2em]">
            {SIZES.map((s, i) => (
              <button
                key={s.name}
                type="button"
                aria-pressed={i === size}
                onClick={() => {
                  stop();
                  setSize(i);
                }}
                className={`rounded-[0.45em] px-[0.9em] py-[0.5em] text-[0.85em] font-semibold leading-none transition-colors ${
                  i === size
                    ? "bg-mock-ink text-mock-inverse"
                    : "text-mock-mute hover:text-mock-ink"
                }`}
              >
                {s.name}{" "}
                <span className="font-normal tabular-nums opacity-70">
                  {s.seats}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className={LABEL}>Number of tables</span>
          <div className="mt-[0.45em] flex items-center gap-[0.5em] rounded-[0.6em] border border-mock-line bg-mock-card p-[0.2em]">
            <button
              type="button"
              aria-label="Fewer tables"
              disabled={batch === 1}
              onClick={() => setBatch(batch - 1)}
              className={ROUND}
            >
              −
            </button>
            <span className="w-[1.4em] text-center text-[0.9em] font-semibold tabular-nums">
              {batch}
            </span>
            <button
              type="button"
              aria-label="More tables"
              disabled={batch === MAX_BATCH}
              onClick={() => setBatch(batch + 1)}
              className={ROUND}
            >
              +
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            stop();
            addTables(batch, SIZES[size].seats, floor);
          }}
          className="ml-auto h-[2.5em] rounded-[0.6em] bg-mock-go px-[1.2em] text-[0.92em] font-bold text-mock-inverse @max-xl:w-full"
        >
          Add to floor {floor + 1}
        </button>
      </div>

      <div className="mt-[0.9em] flex gap-[0.4em]">
        {FLOORS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === floor}
            onClick={() => setFloor(f)}
            className={`rounded-[0.5em] px-[0.9em] py-[0.55em] text-[0.82em] font-semibold leading-none tabular-nums transition-colors ${
              f === floor
                ? "bg-mock-ink text-mock-inverse"
                : "bg-mock-fog text-mock-mute hover:text-mock-ink"
            }`}
          >
            Floor {f + 1} ({tables.filter((t) => t.floor === f).length})
          </button>
        ))}
      </div>

      <div className="mt-[0.9em] grid min-h-0 flex-1 grid-cols-4 content-start gap-[0.8em] overflow-y-auto @max-xl:grid-cols-3 @max-xl:gap-[0.6em]">
        {here.length === 0 && (
          <p className="col-span-full py-[2em] text-center text-[0.9em] text-mock-mute">
            No tables on this floor yet. Choose a size and add some.
          </p>
        )}
        {here.map((t) => (
          <div
            key={t.id}
            className="animate-[mock-pop_0.35s_ease-out] rounded-[0.9em] border border-mock-line p-[0.7em]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[0.9em] font-bold leading-none">
                Table {t.id}
              </span>
              <button
                type="button"
                aria-label={`Remove table ${t.id}`}
                onClick={() => {
                  stop();
                  setTables((all) => all.filter((other) => other !== t));
                }}
                className="grid size-[1.5em] place-items-center rounded-full leading-none text-mock-mute hover:bg-mock-fog hover:text-mock-ink"
              >
                ×
              </button>
            </div>
            <Seats count={t.seats} />
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label={`One seat fewer at table ${t.id}`}
                disabled={t.seats === 1}
                onClick={() => {
                  stop();
                  resize(t.id, -1);
                }}
                className={ROUND}
              >
                −
              </button>
              <span className="text-center leading-tight">
                <span className="block text-[0.85em] font-semibold tabular-nums">
                  {t.seats} {t.seats === 1 ? "seat" : "seats"}
                </span>
                <span className="block text-[0.7em] text-mock-mute">
                  {party(t.seats)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`One more seat at table ${t.id}`}
                disabled={t.seats === MAX_SEATS}
                onClick={() => {
                  stop();
                  resize(t.id, 1);
                }}
                className={ROUND}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A table from above. Seats shuffle round to make room for a new one. */
function Seats({ count }: { count: number }) {
  return (
    <div aria-hidden="true" className="relative mx-auto my-[0.2em] size-[4.4em]">
      <span className="absolute inset-[1.15em] rounded-full border border-mock-line bg-mock-fog" />
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            transform: `rotate(${(360 / count) * i}deg) translateY(-1.65em)`,
          }}
          className="absolute left-1/2 top-1/2 -ml-[0.5em] -mt-[0.35em] h-[0.7em] w-[1em] animate-[mock-pop_0.35s_ease-out] rounded-[0.25em] bg-mock-ink transition-transform duration-500"
        />
      ))}
    </div>
  );
}
