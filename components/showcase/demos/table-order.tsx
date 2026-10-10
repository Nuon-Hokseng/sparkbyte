"use client";

import Image from "next/image";
import { useState } from "react";
import { PANEL, money, useScript, type DemoProps } from "./kit";

// Each dish's photo is public/pos/<photo>.webp.
const MENU = [
  {
    name: "Food",
    items: [
      { name: "Chicken curry", price: 6.5, photo: "curry-rice" },
      { name: "Grilled fish", price: 12, photo: "grilled-fish" },
      { name: "Noodle soup", price: 5.5, photo: "noodle-soup" },
      { name: "Spring rolls", price: 4.5, photo: "spring-rolls" },
    ],
  },
  {
    name: "Drinks",
    items: [
      { name: "Iced coffee", price: 2.5, photo: "iced-coffee" },
      { name: "Iced latte", price: 3, photo: "iced-latte" },
      { name: "Coconut", price: 3, photo: "coconut" },
      { name: "Jasmine tea", price: 1.5, photo: "tea" },
    ],
  },
  {
    name: "Dessert",
    items: [
      { name: "Fruit plate", price: 3.5, photo: "fruit-plate" },
      { name: "Mango rice", price: 4, photo: "mango-rice" },
      { name: "Ice cream", price: 3, photo: "ice-cream" },
      { name: "Banana bread", price: 3.5, photo: "banana-bread" },
    ],
  },
];
const PRICE = new Map(
  MENU.flatMap((group) =>
    group.items.map((item): [string, number] => [item.name, item.price]),
  ),
);
// What the table has ordered once the opening moves are over.
const ORDERED: Order = {
  "Chicken curry": 1,
  "Grilled fish": 1,
  "Iced coffee": 2,
};

/** How many of each dish, in the order they were first added. */
type Order = Record<string, number>;

/**
 * A table's running bill: pick dishes from the menu's subcategories, watch the
 * bill add up, and close it when the guests leave.
 */
export function TableOrder({ play, settled }: DemoProps) {
  const [order, setOrder] = useState<Order>(settled ? ORDERED : {});
  const [group, setGroup] = useState(0);
  const [booked, setBooked] = useState(false);
  const [paid, setPaid] = useState(false);

  const add = (dish: string) =>
    setOrder((o) => ({ ...o, [dish]: (o[dish] ?? 0) + 1 }));

  const stop = useScript(play, () => [
    [800, () => add("Chicken curry")],
    [650, () => add("Grilled fish")],
    [800, () => setGroup(1)],
    [600, () => add("Iced coffee")],
    [500, () => add("Iced coffee")],
  ]);

  const lines = Object.entries(order);
  const count = lines.reduce((sum, [, qty]) => sum + qty, 0);
  const total = lines.reduce(
    (sum, [dish, qty]) => sum + qty * (PRICE.get(dish) ?? 0),
    0,
  );

  const tap = (dish: string) => {
    stop();
    // Ordering at a table that has just paid starts its next bill.
    if (paid) {
      setPaid(false);
      setOrder({ [dish]: 1 });
    } else add(dish);
  };

  return (
    <div
      className={`grid size-full grid-cols-[21em_1fr] gap-[1.4em] bg-mock-fog p-[1.5em] @max-xl:grid-cols-1 @max-xl:content-between @max-xl:gap-[0.8em] @max-xl:p-[1.2em] ${PANEL}`}
    >
      {/* On a narrow canvas both columns dissolve into one, reordered. */}
      <div className="flex min-h-0 flex-col @max-xl:contents">
        <span className="text-[0.9em] font-semibold leading-none text-mock-mute @max-xl:hidden">
          ← Tables
        </span>
        <div className="mt-[0.9em] rounded-[1.1em] border border-mock-accent bg-mock-accent-soft px-[1.2em] py-[1.3em] text-center @max-xl:order-1 @max-xl:mt-0 @max-xl:py-[0.9em]">
          <span className="block text-[0.72em] font-semibold uppercase tracking-[0.08em] text-mock-accent">
            {paid ? "Paid in cash" : "Now serving"}
          </span>
          <span className="block text-[2.4em] font-bold leading-tight @max-xl:text-[2em]">
            Table 6
          </span>
          <span
            key={count}
            className="block animate-[mock-in_0.3s_ease-out] text-[0.95em] tabular-nums text-mock-mute"
          >
            {paid
              ? "Free for the next guests"
              : `${count} ${count === 1 ? "item" : "items"} · ${money(total)}`}
          </span>
          <span className="mt-[0.9em] inline-flex rounded-[0.6em] border border-mock-line bg-mock-card p-[0.2em]">
            {["Walk-in", "Booked"].map((kind, i) => (
              <button
                key={kind}
                type="button"
                aria-pressed={booked === (i === 1)}
                onClick={() => setBooked(i === 1)}
                className={`rounded-[0.45em] px-[0.9em] py-[0.5em] text-[0.8em] font-semibold leading-none transition-colors ${
                  booked === (i === 1)
                    ? "bg-mock-accent text-mock-inverse"
                    : "text-mock-mute hover:text-mock-ink"
                }`}
              >
                {kind}
              </button>
            ))}
          </span>
        </div>

        <ul className="mt-[0.9em] min-h-0 flex-1 overflow-y-auto @max-xl:hidden">
          {!paid &&
            lines.map(([dish, qty]) => (
              <li
                key={dish}
                className="flex animate-[mock-in_0.35s_ease-out] justify-between gap-[0.8em] border-b border-mock-line py-[0.6em] text-[0.88em] leading-none"
              >
                <span className="truncate">
                  {qty} × {dish}
                </span>
                <span className="tabular-nums">
                  {money(qty * (PRICE.get(dish) ?? 0))}
                </span>
              </li>
            ))}
        </ul>

        <button
          type="button"
          disabled={!paid && count === 0}
          onClick={() => {
            stop();
            if (paid) setOrder({});
            setPaid(!paid);
          }}
          className="mt-[0.9em] h-[3.4em] shrink-0 rounded-[0.7em] bg-mock-go font-bold tabular-nums text-mock-inverse transition-opacity disabled:opacity-40 @max-xl:order-3 @max-xl:mt-0 @max-xl:h-[3.2em]"
        >
          {paid ? "Start a new bill" : `Close & pay cash — ${money(total)}`}
        </button>
      </div>

      <div className="flex min-h-0 flex-col justify-between @max-xl:contents">
        <div className="rounded-[1.1em] border border-mock-line bg-mock-card p-[1.1em] @max-xl:order-2 @max-xl:p-[0.9em]">
          <div className="flex gap-[0.4em]">
            {MENU.map((g, i) => (
              <button
                key={g.name}
                type="button"
                aria-pressed={i === group}
                onClick={() => {
                  stop();
                  setGroup(i);
                }}
                className={`rounded-full px-[1.1em] py-[0.55em] text-[0.82em] font-semibold leading-none transition-colors ${
                  i === group
                    ? "bg-mock-ink text-mock-inverse"
                    : "bg-mock-fog text-mock-mute hover:text-mock-ink"
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div
            key={group}
            className="mt-[0.9em] grid grid-cols-2 gap-[0.6em] @max-xl:mt-[0.7em]"
          >
            {MENU[group].items.map((dish, i) => {
              const qty = paid ? 0 : (order[dish.name] ?? 0);
              return (
                <button
                  key={dish.name}
                  type="button"
                  onClick={() => tap(dish.name)}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className={`relative flex h-[5.2em] animate-[mock-in_0.35s_ease-out_backwards] items-center gap-[0.7em] rounded-[0.8em] border p-[0.6em] text-left transition-[border-color,scale] active:scale-95 @max-xl:h-[4.6em] @max-xl:p-[0.5em] ${
                    qty
                      ? "border-mock-accent"
                      : "border-mock-line hover:border-mock-mute"
                  }`}
                >
                  <Image
                    src={`/pos/${dish.photo}.webp`}
                    alt=""
                    width={240}
                    height={240}
                    sizes="96px"
                    className="h-full w-auto shrink-0 rounded-[0.5em] object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.9em] font-semibold leading-tight">
                      {dish.name}
                    </span>
                    <span className="mt-[0.35em] block text-[0.82em] leading-none tabular-nums text-mock-mute">
                      {money(dish.price)}
                    </span>
                  </span>
                  {qty > 0 && (
                    <span
                      key={qty}
                      className="absolute -right-[0.5em] -top-[0.5em] grid size-[1.8em] animate-[mock-pop_0.3s_ease-out] place-items-center rounded-full bg-mock-accent text-[0.75em] font-bold leading-none text-mock-inverse"
                    >
                      {qty}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex w-[21em] -rotate-2 items-center gap-[1em] self-end rounded-[1.1em] bg-mock-ink p-[0.9em] text-mock-inverse @max-xl:order-4 @max-xl:w-full @max-xl:rotate-0 @max-xl:p-[0.7em]">
          <Qr />
          <span className="leading-snug">
            <span className="block font-semibold">QR menu</span>
            <span className="block text-[0.8em] text-mock-inverse/70">
              Guests scan and order from their seat. Set up on request.
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

const QR_SIZE = 21;
const inEye = (x: number, y: number) =>
  (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
// The speckle between a QR code's three corner squares. It only has to look
// the part; it does not encode anything.
const QR_DOTS = Array.from({ length: QR_SIZE * QR_SIZE }, (_, i) => [
  i % QR_SIZE,
  Math.floor(i / QR_SIZE),
])
  .filter(([x, y]) => !inEye(x, y) && (x * 7 + y * 11 + x * y) % 3 === 0)
  .map(([x, y]) => `M${x} ${y}h1v1h-1z`)
  .join("");

function Qr() {
  return (
    <svg
      viewBox="-1.5 -1.5 24 24"
      aria-hidden="true"
      className="size-[4.6em] shrink-0 rounded-[0.5em] bg-mock-card text-mock-ink @max-xl:size-[3.4em]"
    >
      <path d={QR_DOTS} fill="currentColor" />
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect
            x={x + 0.5}
            y={y + 0.5}
            width="6"
            height="6"
            fill="none"
            stroke="currentColor"
          />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}
