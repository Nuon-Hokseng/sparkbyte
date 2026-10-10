"use client";

import { useState } from "react";
import { PANEL, typed, useScript, type DemoProps, type Step } from "./kit";

const START = ["Product Name", "Quantity", "Unit Price", "Discount", "Group"];
// What the opening moves rename, to suit an optician's frames.
const RENAMES: [field: number, to: string][] = [
  [0, "Frame model"],
  [2, "Price per pair"],
  [4, "Brand"],
];
const RENAMED = START.map(
  (label, i) => RENAMES.find(([field]) => field === i)?.[1] ?? label,
);
const INPUTS = [
  { hint: "Name" },
  { hint: "Select quantity", select: true },
  { hint: "Enter price", select: true },
  { hint: "Select discount", select: true },
  { hint: "Select group", select: true },
];
const SAVED = [
  ["Aviator 52", "2", "$120.00", "10%", "Classic"],
  ["Round 48", "1", "$85.00", "0%", "Titanium"],
];

/**
 * A product tab's form. Every field name is a text box of its own, and the
 * saved records below take whatever the fields are called.
 */
export function Fields({ play, settled }: DemoProps) {
  const [labels, setLabels] = useState(settled ? RENAMED : START);
  // The field being renamed, by the opening moves or by the visitor.
  const [editing, setEditing] = useState(-1);

  const rename = (field: number, to: string) =>
    setLabels((all) => all.map((label, i) => (i === field ? to : label)));

  const stop = useScript(play, () => [
    ...RENAMES.flatMap(([field, to]): Step[] => [
      [650, () => setEditing(field)],
      [350, () => rename(field, "")],
      ...typed(to, (soFar) => rename(field, soFar)),
    ]),
    [600, () => setEditing(-1)],
  ]);

  return (
    <div className="flex size-full flex-col justify-center gap-[1.2em] @max-xl:gap-[1em]">
      <div className={`bg-mock-card p-[1.6em] @max-xl:p-[1.2em] ${PANEL}`}>
        <p className="text-[1.3em] font-semibold leading-tight">
          Frame information
        </p>
        <div className="mt-[1.2em] grid grid-cols-5 gap-[1.2em] @max-xl:mt-[0.9em] @max-xl:grid-cols-1 @max-xl:gap-[0.6em]">
          {labels.map((label, i) => (
            <div
              key={i}
              className="min-w-0 @max-xl:grid @max-xl:grid-cols-2 @max-xl:items-center @max-xl:gap-[0.8em]"
            >
              <input
                value={label}
                maxLength={18}
                placeholder="Field name"
                aria-label={`Name of field ${i + 1}`}
                onChange={(e) => rename(i, e.target.value)}
                onFocus={(e) => {
                  stop();
                  setEditing(i);
                  // Ready to be typed over.
                  e.target.select();
                }}
                onBlur={() => setEditing(-1)}
                className={`w-full min-w-0 rounded-[0.45em] border bg-transparent px-[0.55em] py-[0.35em] text-[0.9em] font-semibold outline-none transition-[border-color,box-shadow] duration-200 placeholder:font-normal placeholder:text-mock-mute/60 ${
                  editing === i
                    ? "border-mock-accent shadow-[0_0_0_0.22em_var(--mock-accent-soft)]"
                    : "border-dashed border-mock-line hover:border-mock-mute"
                }`}
              />
              <span className="mt-[0.6em] flex h-[2.9em] items-center justify-between gap-[0.4em] rounded-[0.6em] border border-mock-line px-[0.8em] text-[0.82em] text-mock-mute/80 @max-xl:mt-0 @max-xl:h-[2.6em]">
                <span className="truncate">{INPUTS[i].hint}</span>
                {INPUTS[i].select && (
                  <span className="size-[1.1em] shrink-0 rounded-full bg-mock-ink" />
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-[1.2em] flex justify-end @max-xl:hidden">
          <span className="rounded-[0.6em] border border-mock-line px-[1.6em] py-[0.7em] text-[0.9em] font-semibold leading-none text-mock-mute">
            Save
          </span>
        </div>
      </div>

      {/* One column per field on a wide canvas, one row per field on a narrow
          one: either way each name sits beside what was saved under it. */}
      <div
        className={`bg-mock-card px-[1.6em] pb-[1.2em] pt-[1.3em] @max-xl:px-[1.2em] @max-xl:pb-[0.7em] @max-xl:pt-[1em] ${PANEL}`}
      >
        <p className="font-semibold leading-tight">Saved frames</p>
        <div className="mt-[0.8em] flex gap-[1.2em] @max-xl:mt-[0.4em] @max-xl:flex-col @max-xl:gap-0">
          {labels.map((label, i) => (
            <div
              key={i}
              className="min-w-0 flex-1 @max-xl:flex @max-xl:items-center @max-xl:justify-between @max-xl:gap-[1em] @max-xl:border-b @max-xl:border-mock-line @max-xl:py-[0.5em] @max-xl:last:border-0"
            >
              <span
                className={`block truncate border-b border-mock-line px-[0.6em] pb-[0.55em] text-[0.8em] font-semibold transition-colors duration-200 @max-xl:border-0 @max-xl:p-0 ${
                  editing === i ? "text-mock-accent" : "text-mock-mute"
                }`}
              >
                {label || "…"}
              </span>
              {SAVED.map((row, r) => (
                <span
                  key={r}
                  className={`block truncate border-b border-mock-line px-[0.55em] py-[0.6em] text-[0.88em] tabular-nums last:border-0 @max-xl:border-0 @max-xl:p-0 ${
                    r > 0 ? "@max-xl:hidden" : ""
                  }`}
                >
                  {row[i]}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
