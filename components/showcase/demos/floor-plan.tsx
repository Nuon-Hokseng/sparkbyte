"use client";

import { useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { PANEL, money, useScript, type DemoProps, type Step } from "./kit";

/** `x` and `y` are 0..1 across the room a table has to move in. */
type Table = { id: number; x: number; y: number; seats: number; bill?: number };
/** A straight wall. `x`, `y` and `len` are 0..1 across the board. */
type Wall = { x: number; y: number; len: number; dir: "h" | "v" };

// A table tile's size and a wall's thickness, in em.
const TILE_W = 6;
const TILE_H = 5.4;
const WALL = 0.4;

const LAYOUT: Table[] = [
  { id: 1, x: 0.02, y: 0.08, seats: 2 },
  { id: 2, x: 0.27, y: 0.08, seats: 2 },
  { id: 3, x: 0.52, y: 0.08, seats: 2, bill: 14.5 },
  { id: 4, x: 0.06, y: 0.74, seats: 4, bill: 32 },
  { id: 5, x: 0.34, y: 0.74, seats: 4 },
  { id: 6, x: 0.74, y: 0.76, seats: 2 },
];
// Fresh from Settings, the tables wait in a heap to be put in their places.
const HEAP = LAYOUT.map((t, i) => ({ ...t, x: 0.4 + i * 0.014, y: 0.38 + i * 0.02 }));
const WALLS: Wall[] = [
  // The kitchen, with a doorway in its left wall.
  { x: 0.68, y: 0.08, len: 0.28, dir: "h" },
  { x: 0.96, y: 0.08, len: 0.4, dir: "v" },
  { x: 0.68, y: 0.48, len: 0.28, dir: "h" },
  { x: 0.68, y: 0.08, len: 0.24, dir: "v" },
  // A screen between the two rows of tables.
  { x: 0.04, y: 0.52, len: 0.42, dir: "h" },
];

const GRID =
  "linear-gradient(var(--mock-line) 1px, transparent 1px), linear-gradient(90deg, var(--mock-line) 1px, transparent 1px)";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// Wall ends snap to a fine grid, so corners meet.
const snap = (v: number) => Math.round(clamp01(v) * 50) / 50;
const pct = (v: number) => `${v * 100}%`;

/**
 * The Receipt screen's floor plan: tables are dragged to where they stand in
 * the real room, and walls are drawn around them.
 */
export function FloorPlan({ play, settled }: DemoProps) {
  const [tables, setTables] = useState(settled ? LAYOUT : HEAP);
  const [walls, setWalls] = useState<Wall[]>(settled ? WALLS : []);
  const [mode, setMode] = useState<"tables" | "walls">("tables");
  // True until the opening moves have laid the floor out.
  const [arranging, setArranging] = useState(!settled);
  const [held, setHeld] = useState(0);
  const [draft, setDraft] = useState<Wall | null>(null);

  const board = useRef<HTMLDivElement>(null);
  // The table being dragged: where it and the pointer started, and how many
  // px its 0..1 covers.
  const drag = useRef<{
    id: number;
    px: number;
    py: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  // Where the wall being drawn started, and the board's box on screen.
  const pen = useRef<{ x: number; y: number; box: DOMRect } | null>(null);

  const move = (id: number, x: number, y: number) =>
    setTables((all) =>
      all.map((t) =>
        t.id === id ? { ...t, x: clamp01(x), y: clamp01(y) } : t,
      ),
    );

  const stop = useScript(play, () => [
    ...LAYOUT.map(
      (t, i): Step => [i ? 150 : 700, () => move(t.id, t.x, t.y)],
    ),
    ...WALLS.map(
      (wall, i): Step => [i ? 260 : 800, () => setWalls((all) => [...all, wall])],
    ),
    [700, () => setArranging(false)],
  ]);

  // The visitor has started: finish laying the floor out at once.
  const takeOver = () => {
    stop();
    if (!arranging) return;
    setArranging(false);
    setTables(LAYOUT);
    setWalls(WALLS);
  };

  const grab = (e: PointerEvent<HTMLButtonElement>, t: Table) => {
    if (!board.current) return;
    takeOver();
    const tile = e.currentTarget;
    tile.setPointerCapture(e.pointerId);
    drag.current = {
      id: t.id,
      px: e.clientX,
      py: e.clientY,
      x: t.x,
      y: t.y,
      w: board.current.clientWidth - tile.offsetWidth,
      h: board.current.clientHeight - tile.offsetHeight,
    };
    setHeld(t.id);
  };

  const pull = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    move(d.id, d.x + (e.clientX - d.px) / d.w, d.y + (e.clientY - d.py) / d.h);
  };

  const release = () => {
    drag.current = null;
    setHeld(0);
  };

  const nudge = (e: KeyboardEvent, t: Table) => {
    const by: Record<string, [number, number]> = {
      ArrowLeft: [-0.04, 0],
      ArrowRight: [0.04, 0],
      ArrowUp: [0, -0.04],
      ArrowDown: [0, 0.04],
    };
    const step = by[e.key];
    if (!step) return;
    e.preventDefault();
    takeOver();
    move(t.id, t.x + step[0], t.y + step[1]);
  };

  const penDown = (e: PointerEvent<HTMLDivElement>) => {
    if (mode !== "walls") return;
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    const x = snap((e.clientX - box.left) / box.width);
    const y = snap((e.clientY - box.top) / box.height);
    pen.current = { x, y, box };
    setDraft({ x, y, len: 0, dir: "h" });
  };

  const penMove = (e: PointerEvent) => {
    const from = pen.current;
    if (!from) return;
    const x = snap((e.clientX - from.box.left) / from.box.width);
    const y = snap((e.clientY - from.box.top) / from.box.height);
    // Walls run straight: along whichever way the pointer has gone further.
    const across =
      Math.abs(x - from.x) * from.box.width >=
      Math.abs(y - from.y) * from.box.height;
    setDraft(
      across
        ? { x: Math.min(from.x, x), y: from.y, len: Math.abs(x - from.x), dir: "h" }
        : { x: from.x, y: Math.min(from.y, y), len: Math.abs(y - from.y), dir: "v" },
    );
  };

  const penUp = () => {
    if (!pen.current) return;
    pen.current = null;
    if (draft && draft.len > 0) setWalls((all) => [...all, draft]);
    setDraft(null);
  };

  return (
    <div className={`flex size-full flex-col bg-mock-card ${PANEL}`}>
      <div className="flex items-center justify-between gap-[1em] px-[1.4em] py-[1em] @max-xl:px-[1.2em]">
        <div className="min-w-0">
          <p className="text-[1.15em] font-bold leading-tight">Floor 1</p>
          <p className="truncate text-[0.8em] text-mock-mute">
            {mode === "tables"
              ? "Drag tables to match your floor."
              : "Drag across the floor to draw a wall."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[0.8em]">
          {mode === "walls" && walls.length > 0 && (
            <button
              type="button"
              onClick={() => setWalls([])}
              className="text-[0.8em] font-semibold text-mock-mute underline underline-offset-2 hover:text-mock-ink"
            >
              Clear walls
            </button>
          )}
          <div className="flex rounded-[0.6em] border border-mock-line p-[0.2em]">
            {(["tables", "walls"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={m === mode}
                onClick={() => {
                  takeOver();
                  setMode(m);
                }}
                className={`rounded-[0.45em] px-[1em] py-[0.55em] text-[0.82em] font-semibold capitalize leading-none transition-colors ${
                  m === mode
                    ? "bg-mock-ink text-mock-inverse"
                    : "text-mock-mute hover:text-mock-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={board}
        onPointerDown={penDown}
        onPointerMove={penMove}
        onPointerUp={penUp}
        onPointerCancel={penUp}
        style={{ backgroundImage: GRID, backgroundSize: "2em 2em" }}
        className={`relative mx-[1.2em] mb-[1.2em] min-h-0 flex-1 overflow-hidden rounded-[0.8em] border border-mock-line bg-mock-fog ${
          mode === "walls" ? "cursor-crosshair touch-none" : ""
        }`}
      >
        {[...walls, ...(draft ? [draft] : [])].map((wall, i) => (
          <span
            key={i}
            style={
              (wall.dir === "h"
                ? {
                    left: `calc(${pct(wall.x)} - ${WALL / 2}em)`,
                    top: `calc(${pct(wall.y)} - ${WALL / 2}em)`,
                    width: `calc(${pct(wall.len)} + ${WALL}em)`,
                    height: `${WALL}em`,
                    "--wall-from": "0 1",
                  }
                : {
                    left: `calc(${pct(wall.x)} - ${WALL / 2}em)`,
                    top: `calc(${pct(wall.y)} - ${WALL / 2}em)`,
                    width: `${WALL}em`,
                    height: `calc(${pct(wall.len)} + ${WALL}em)`,
                    "--wall-from": "1 0",
                  }) as CSSProperties
            }
            className={`absolute rounded-[0.1em] bg-[#394151] ${
              wall.dir === "h" ? "origin-left" : "origin-top"
            } ${arranging ? "animate-[wall-in_0.4s_ease-out]" : ""} ${
              wall === draft ? "opacity-50" : ""
            }`}
          />
        ))}

        {tables.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={`Table ${t.id}, ${
              t.bill ? "in use" : "free"
            }. Drag it, or move it with the arrow keys.`}
            onPointerDown={(e) => grab(e, t)}
            onPointerMove={pull}
            onPointerUp={release}
            onPointerCancel={release}
            onKeyDown={(e) => nudge(e, t)}
            style={{
              left: `calc(${t.x} * (100% - ${TILE_W}em))`,
              top: `calc(${t.y} * (100% - ${TILE_H}em))`,
              width: `${TILE_W}em`,
              height: `${TILE_H}em`,
            }}
            className={`absolute flex flex-col items-center justify-center gap-[0.3em] rounded-[0.8em] border leading-none ${
              t.bill ? "border-mock-accent bg-mock-accent-soft" : "border-mock-line bg-mock-card"
            } ${
              mode === "tables"
                ? "cursor-grab touch-none"
                : "pointer-events-none"
            } ${
              held === t.id
                ? "z-10 scale-105 cursor-grabbing shadow-[0_1em_1.6em_-0.6em_rgba(20,22,31,0.45)]"
                : "shadow-[0_0.3em_0.8em_-0.3em_rgba(20,22,31,0.3)] transition-[left,top,scale,box-shadow] duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
            }`}
          >
            <span
              className={`flex gap-[0.15em] ${
                t.bill ? "text-mock-accent" : "text-mock-mute"
              }`}
            >
              {Array.from({ length: t.seats / 2 }, (_, i) => (
                <Chair key={i} />
              ))}
            </span>
            <span className="text-[0.8em] font-bold">Table {t.id}</span>
            {t.bill ? (
              <span className="rounded-full bg-mock-accent px-[0.7em] py-[0.3em] text-[0.62em] font-bold tabular-nums text-mock-inverse">
                {money(t.bill)}
              </span>
            ) : (
              <span className="text-[0.66em] font-semibold text-mock-go">
                Free · {t.seats}p
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function Chair() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="size-[1.05em]">
      <rect x="4" y="1" width="8" height="7" rx="2" />
      <rect x="3" y="8.6" width="10" height="2.6" rx="1" />
      <rect x="4" y="11.2" width="1.7" height="3.8" />
      <rect x="10.3" y="11.2" width="1.7" height="3.8" />
    </svg>
  );
}
