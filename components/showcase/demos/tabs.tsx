"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  NavRow,
  PANEL,
  typed,
  useScript,
  type DemoProps,
  type Step,
} from "./kit";

const BUILT_IN = ["Frame", "Lens", "Accessories", "Contact Lens"];
// The tabs the opening moves add.
const ADDED = ["Cleaner", "Sunglasses"];

const GROUP =
  "text-[0.7em] font-semibold uppercase tracking-[0.06em] text-mock-mute";

/**
 * Settings → Navigation customization, beside the sidebar it changes. Each tab
 * added here turns up under Products straight away.
 */
export function Tabs({ play, settled }: DemoProps) {
  const [custom, setCustom] = useState<string[]>(settled ? ADDED : []);
  const [draft, setDraft] = useState("");

  const add = (name: string) => {
    setCustom((tabs) => (tabs.includes(name) ? tabs : [...tabs, name]));
    setDraft("");
  };

  const stop = useScript(play, () =>
    ADDED.flatMap((name): Step[] => [
      // A pause before each name, as if thinking of it.
      [600, () => setDraft("")],
      ...typed(name, setDraft),
      [400, () => add(name)],
    ]),
  );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (name) add(name);
  };

  return (
    <div className="flex size-full items-stretch gap-[1.4em] @max-xl:flex-col @max-xl:justify-center @max-xl:gap-[1em]">
      <div
        className={`flex min-h-0 flex-1 flex-col self-center bg-mock-card p-[1.6em] @max-xl:w-full @max-xl:flex-none @max-xl:p-[1.2em] ${PANEL}`}
      >
        <p className="text-[1.3em] font-semibold leading-tight">
          Navigation customization
        </p>
        <p className="mt-[0.4em] text-[0.85em] leading-snug text-mock-mute @max-xl:hidden">
          Add or remove subcategories under{" "}
          <strong className="font-semibold text-mock-ink">Products</strong>.
        </p>

        <p className={`mt-[1.3em] @max-xl:mt-[0.9em] ${GROUP}`}>
          Built-in (locked)
        </p>
        <div className="mt-[0.5em] grid grid-cols-2 gap-[0.5em]">
          {BUILT_IN.map((name) => (
            <span
              key={name}
              className="flex items-center justify-between rounded-[0.6em] border border-mock-line bg-mock-fog px-[0.9em] py-[0.6em] text-[0.88em] leading-none text-mock-mute"
            >
              {name}
              <Lock />
            </span>
          ))}
        </div>

        <p className={`mt-[1.1em] @max-xl:mt-[0.9em] ${GROUP}`}>Custom</p>
        <ul className="mt-[0.5em] flex max-h-[8.4em] flex-col gap-[0.5em] stage-list overflow-y-auto @max-xl:max-h-[5.4em]">
          {custom.length === 0 && (
            <li className="py-[0.5em] text-[0.88em] italic leading-none text-mock-mute">
              No custom categories yet.
            </li>
          )}
          {custom.map((name) => (
            <li
              key={name}
              className="flex animate-[mock-in_0.35s_ease-out] items-center justify-between rounded-[0.6em] border border-mock-line py-[0.25em] pl-[0.9em] pr-[0.4em] text-[0.88em] font-medium leading-none"
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => {
                  stop();
                  setCustom((tabs) => tabs.filter((tab) => tab !== name));
                }}
                className="grid size-[2em] place-items-center rounded-[0.4em] text-[#e5484d] hover:bg-mock-fog"
              >
                <Trash />
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} className="mt-[1em] flex gap-[0.6em]">
          <input
            value={draft}
            maxLength={16}
            placeholder="New category name (e.g. Cleaner)"
            aria-label="New category name"
            onChange={(e) => setDraft(e.target.value)}
            onFocus={stop}
            className="h-[2.9em] min-w-0 flex-1 rounded-[0.6em] border border-mock-line px-[0.9em] text-[0.88em] outline-none transition-colors placeholder:text-mock-mute/70 focus:border-mock-accent"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="h-[2.9em] rounded-[0.6em] bg-mock-go px-[1.2em] text-[0.88em] font-bold text-mock-inverse transition-colors disabled:bg-mock-mute/70"
          >
            + Add
          </button>
        </form>
      </div>

      {/* The sidebar: whole on a wide canvas, only its Products menu on a
          narrow one. */}
      <div
        aria-hidden="true"
        className={`flex w-[17em] shrink-0 flex-col gap-[0.2em] bg-mock-card p-[1em] @max-xl:w-full @max-xl:p-[1.2em] ${PANEL}`}
      >
        <div className="mb-[0.6em] flex items-center gap-[0.7em] border-b border-mock-line px-[0.5em] pb-[1em] pt-[0.4em] @max-xl:hidden">
          <span className="grid size-[2.1em] place-items-center rounded-full bg-mock-ink text-[0.85em] font-semibold text-mock-inverse">
            Y
          </span>
          <span className="leading-tight">
            <span className="block text-[0.72em] font-semibold uppercase tracking-[0.2em]">
              Your Store
            </span>
            <span className="block text-[0.72em] text-mock-mute">POS System</span>
          </span>
        </div>
        <NavRow label="Receipt" className="@max-xl:hidden" />
        <NavRow label="Products" on className="@max-xl:bg-transparent @max-xl:p-0" />
        <div className="ml-[1.1em] flex min-h-0 flex-col stage-list overflow-y-auto border-l border-mock-line pl-[0.9em] @max-xl:ml-0 @max-xl:mt-[0.7em] @max-xl:max-h-[7.4em] @max-xl:flex-row @max-xl:flex-wrap @max-xl:content-start @max-xl:gap-[0.5em] @max-xl:border-0 @max-xl:pl-0">
          {BUILT_IN.map((name) => (
            <span
              key={name}
              className="py-[0.45em] text-[0.88em] leading-tight text-mock-mute @max-xl:rounded-full @max-xl:bg-mock-fog @max-xl:px-[1em] @max-xl:py-[0.6em] @max-xl:leading-none"
            >
              {name}
            </span>
          ))}
          {custom.map((name) => (
            <span
              key={name}
              className="flex animate-[mock-in_0.4s_ease-out] items-center gap-[0.5em] py-[0.45em] text-[0.88em] font-semibold leading-tight text-mock-accent @max-xl:rounded-full @max-xl:bg-mock-accent-soft @max-xl:px-[1em] @max-xl:py-[0.6em] @max-xl:leading-none"
            >
              <span className="size-[0.45em] rounded-full bg-mock-accent" />
              {name}
            </span>
          ))}
        </div>
        <NavRow label="Data" className="@max-xl:hidden" />
        <NavRow label="Settings" className="mt-auto @max-xl:hidden" />
      </div>
    </div>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-[1em]">
      <rect
        x="3.25"
        y="7.25"
        width="9.5"
        height="6.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function Trash() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="size-[1.1em]">
      <path
        d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M6.8 7v3.8M9.2 7v3.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
