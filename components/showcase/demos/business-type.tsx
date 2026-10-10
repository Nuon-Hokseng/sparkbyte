"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { NavRow, PANEL, money, type DemoProps } from "./kit";

const TYPES = [
  {
    name: "Optician",
    about: "Prescriptions, frames & lenses",
    menu: ["Frame", "Lens", "Accessories", "Contact Lens"],
  },
  {
    name: "Retail / Coffee",
    about: "Clothes, coffee, general items",
    menu: ["Coffee", "Tea", "Pastry"],
  },
  {
    name: "Restaurant",
    about: "Tables & running tabs",
    menu: ["Food", "Drinks", "Dessert"],
  },
];
// How long each type stays up while the demo turns through them by itself.
const TURN = 2600;

const EYES = [
  ["Right", "-1.25", "-0.50", "180"],
  ["Left", "-1.00", "-0.75", "170"],
];
// Each item's photo is public/pos/<photo>.webp.
const SHELF = [
  { name: "Iced latte", price: 3.5, photo: "iced-latte" },
  { name: "Croissant", price: 2.6, photo: "croissant" },
  { name: "Iced coffee", price: 2.5, photo: "iced-coffee" },
  { name: "Latte", price: 3.2, photo: "latte" },
  { name: "Banana bread", price: 2.4, photo: "banana-bread" },
  { name: "Jasmine tea", price: 1.5, photo: "tea" },
];
const FLOOR = [0, 18.5, 0, 0, 32, 0];

/**
 * Settings → Business type. Choosing a type changes the Products menu and
 * what the Receipt screen is built around.
 */
export function BusinessType({ play }: DemoProps) {
  const [type, setType] = useState(0);
  const turning = useRef(0);

  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(
      () => setType((t) => (t + 1) % TYPES.length),
      TURN,
    );
    turning.current = id;
    return () => window.clearInterval(id);
  }, [play]);

  const pick = (i: number) => {
    window.clearInterval(turning.current);
    setType(i);
  };

  return (
    <div className={`flex size-full flex-col overflow-hidden bg-mock-card ${PANEL}`}>
      <div className="p-[1.5em] @max-xl:p-[1.2em]">
        <p className="text-[1.3em] font-semibold leading-tight">Business type</p>
        <p className="mt-[0.2em] text-[0.9em] text-mock-mute">
          Choose the kind of business
        </p>
        <div className="mt-[1.3em] grid grid-cols-3 gap-[0.8em] @max-xl:gap-[0.5em]">
          {TYPES.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-pressed={i === type}
              onClick={() => pick(i)}
              className={`rounded-[0.9em] border p-[1em] text-left transition-colors duration-300 @max-xl:p-[0.8em] ${
                i === type
                  ? "border-mock-accent bg-mock-accent-soft ring-1 ring-mock-accent"
                  : "border-mock-line bg-mock-card hover:border-mock-mute"
              }`}
            >
              {/* The badge sits beside the name, and drops under it where
                  the card is too narrow for both. */}
              <span className="flex flex-wrap items-center justify-between gap-x-[0.6em] gap-y-[0.35em]">
                <span className="font-semibold leading-tight">{t.name}</span>
                {i === type && (
                  <span className="animate-[mock-pop_0.35s_ease-out] rounded-full bg-mock-accent px-[0.85em] py-[0.4em] text-[0.62em] font-bold leading-none text-mock-inverse">
                    Active
                  </span>
                )}
              </span>
              <span className="mt-[0.3em] block text-[0.8em] leading-snug text-mock-mute @max-xl:hidden">
                {t.about}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* The POS itself, rebuilt around whichever type is active. */}
      <div
        aria-hidden="true"
        className="flex min-h-0 flex-1 border-t border-mock-line bg-mock-fog"
      >
        <div className="flex w-[13em] shrink-0 flex-col gap-[0.2em] border-r border-mock-line bg-mock-card p-[0.9em] @max-xl:w-[10.5em] @max-xl:p-[0.7em]">
          <NavRow label="Receipt" on />
          <NavRow label="Products" />
          <div
            key={type}
            className="ml-[1.1em] border-l border-mock-line pl-[0.9em]"
          >
            {TYPES[type].menu.map((item, i) => (
              <span
                key={item}
                style={{ animationDelay: `${i * 70}ms` }}
                className="block animate-[mock-in_0.4s_ease-out_backwards] py-[0.4em] text-[0.85em] leading-tight text-mock-mute"
              >
                {item}
              </span>
            ))}
          </div>
          <NavRow label="Data" />
          <NavRow label="Settings" className="mt-auto" />
        </div>

        <div
          key={type}
          className="min-w-0 flex-1 animate-[mock-in_0.45s_ease-out] p-[1.3em] @max-xl:p-[1em]"
        >
          {type === 0 && <Prescription />}
          {type === 1 && <Shelf />}
          {type === 2 && <Tables />}
        </div>
      </div>
    </div>
  );
}

function Prescription() {
  return (
    <>
      <p className="font-semibold">Prescription</p>
      <div className="mt-[0.7em] grid grid-cols-4 overflow-hidden rounded-[0.7em] border border-mock-line bg-mock-card text-[0.85em]">
        {["Eye", "SPH", "CYL", "AXIS"].map((head) => (
          <span
            key={head}
            className="bg-mock-fog px-[0.9em] py-[0.6em] font-semibold text-mock-mute"
          >
            {head}
          </span>
        ))}
        {EYES.flat().map((cell, i) => (
          <span
            key={i}
            className={`border-t border-mock-line px-[0.9em] py-[0.6em] tabular-nums ${
              i % 4 === 0 ? "font-semibold" : ""
            }`}
          >
            {cell}
          </span>
        ))}
      </div>
      {[
        ["Frame", "Titanium frame", 120],
        ["Lens", "Blue-light lenses", 65],
      ].map(([kind, name, price]) => (
        <div
          key={kind}
          className="mt-[0.6em] flex items-center gap-[0.8em] rounded-[0.7em] border border-mock-line bg-mock-card px-[0.9em] py-[0.65em] text-[0.85em]"
        >
          <span className="w-[3.4em] text-mock-mute">{kind}</span>
          <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
          <span className="tabular-nums">{money(Number(price))}</span>
        </div>
      ))}
    </>
  );
}

function Shelf() {
  return (
    <>
      <p className="font-semibold">Products</p>
      <div className="mt-[0.7em] grid grid-cols-3 gap-[0.6em] @max-xl:grid-cols-2">
        {SHELF.map((item, i) => (
          <div
            key={item.name}
            style={{ animationDelay: `${i * 50}ms` }}
            className="flex h-[5.6em] animate-[mock-pop_0.35s_ease-out_backwards] items-center gap-[0.7em] rounded-[0.7em] border border-mock-line bg-mock-card p-[0.6em]"
          >
            <Image
              src={`/pos/${item.photo}.webp`}
              alt=""
              width={240}
              height={240}
              sizes="96px"
              className="h-full w-auto shrink-0 rounded-[0.5em] object-cover"
            />
            <span className="min-w-0 text-[0.82em] leading-tight">
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="mt-[0.3em] block tabular-nums text-mock-mute">
                {money(item.price)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Tables() {
  return (
    <>
      <p className="font-semibold">Tables</p>
      <div className="mt-[0.7em] grid grid-cols-3 gap-[0.6em] @max-xl:grid-cols-2">
        {FLOOR.map((bill, i) => (
          <div
            key={i}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`flex h-[5.6em] animate-[mock-pop_0.35s_ease-out_backwards] flex-col items-center justify-center gap-[0.25em] rounded-[0.7em] border leading-none ${
              bill ? "border-mock-accent bg-mock-accent-soft" : "border-mock-line bg-mock-card"
            }`}
          >
            <span className="text-[0.9em] font-bold">Table {i + 1}</span>
            {bill ? (
              <span className="rounded-full bg-mock-accent px-[0.7em] py-[0.3em] text-[0.7em] font-bold tabular-nums text-mock-inverse">
                {money(bill)}
              </span>
            ) : (
              <span className="text-[0.75em] font-semibold text-mock-go">
                Free
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
