"use client";

export { typed, useScript, type Step } from "@/hooks/use-script";

// What the showcase's demos share.

export type DemoProps = {
  /** Play the opening moves. Remount (change `key`) to play them again. */
  play: boolean;
  /** Start from the finished state, for visitors who asked for less motion. */
  settled: boolean;
};

/** The shape and shadow of the panels the demos are drawn on. */
export const PANEL =
  "rounded-[1.2em] shadow-[0_2.5em_5em_-1.5em_rgba(0,0,0,0.8)] ring-1 ring-white/10";

export const money = (n: number) => `$${n.toFixed(2)}`;

/** A row of the POS's sidebar. */
export function NavRow({
  label,
  on = false,
  className = "",
}: {
  label: string;
  on?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`flex items-center gap-[0.7em] rounded-[0.5em] px-[0.7em] py-[0.55em] ${
        on ? "bg-mock-fog" : ""
      } ${className}`}
    >
      <span className="size-[0.85em] shrink-0 rounded-[0.2em] bg-mock-ink" />
      <span className="text-[0.9em] font-medium leading-none">{label}</span>
    </span>
  );
}
