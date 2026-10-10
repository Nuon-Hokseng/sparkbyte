"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const links = [
  { href: "/#pos", label: "POS systems" },
  { href: "/#apps", label: "Mobile apps" },
  { href: "/#process", label: "How we work" },
  { href: "/#contact", label: "Contact" },
];

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const getScrolled = () => window.scrollY > 8;
const getScrolledOnServer = () => false;

export function SiteHeader() {
  const scrolled = useSyncExternalStore(
    subscribeScroll,
    getScrolled,
    getScrolledOnServer,
  );
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    // The hero mark floats above the header; this hides it behind the menu.
    html.dataset.menuOpen = "";

    const firstLink = panelRef.current?.querySelector<HTMLElement>("a");
    firstLink?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep Tab inside the menu: toggle button plus the panel's links.
      const items = [
        buttonRef.current,
        ...Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a") ?? []),
      ].filter((el): el is HTMLElement => el !== null);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const outside = !active || !items.includes(active);
      if (e.shiftKey && (outside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (outside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // The menu is mobile-only, so close it if the window grows past that.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onBreakpoint);

    return () => {
      html.style.overflow = previousOverflow;
      delete html.dataset.menuOpen;
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <>
      {/* Without JavaScript nothing flies the mark into the header, so show
          the header icon outright. */}
      <noscript>
        <style>{`[data-dock]{--dock:1;--dock-icon:1}`}</style>
      </noscript>

      <a
        href="#main"
        className="fixed left-4 top-4 z-60 -translate-y-24 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-colors duration-300 ${
          solid
            ? "border-white/10 bg-ink/85 backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-360 items-center justify-between pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:px-8 lg:h-20 lg:px-16">
          {/* --dock (0..1) and --dock-icon (0..1) are driven by the hero mark as
              it flies in: the tile opens up, then the icon takes over. */}
          <Link
            href="/"
            data-dock=""
            className="flex items-center font-display text-[1.375rem] font-medium tracking-tight lg:text-2xl"
            onClick={() => setOpen(false)}
          >
            <span
              data-dock-target=""
              className="relative mr-[calc(var(--dock)*0.75rem)] block h-(--tile) w-[calc(var(--dock)*var(--tile))] shrink-0 [--tile:2.25rem] lg:[--tile:2.5rem]"
            >
              <span className="absolute left-0 top-0 block size-(--tile) overflow-hidden rounded-[10px] border border-line opacity-(--dock)">
                <Image
                  src="/icon-192.png"
                  alt=""
                  width={40}
                  height={40}
                  className="size-full opacity-(--dock-icon)"
                />
              </span>
            </span>
            SparkByte
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-10 text-[0.9375rem] text-mist">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="py-2 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/#contact"
              className="hidden h-11 items-center rounded-full bg-white px-5 text-[0.9375rem] font-semibold text-ink transition-colors hover:bg-mist sm:inline-flex"
            >
              Book a demo
            </Link>

            <button
              ref={buttonRef}
              type="button"
              className="relative -mr-2 grid size-11 place-items-center rounded-full lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span
                aria-hidden="true"
                className={`absolute h-px w-6 bg-white transition-transform duration-300 motion-reduce:transition-none ${
                  open ? "rotate-45" : "-translate-y-1.25"
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute h-px w-6 bg-white transition-transform duration-300 motion-reduce:transition-none ${
                  open ? "-rotate-45" : "translate-y-1.25"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={panelRef}
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 flex flex-col overflow-y-auto bg-ink/95 pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[calc(4rem+env(safe-area-inset-top)+1.5rem)] backdrop-blur-xl duration-300 motion-reduce:transition-none sm:px-8 lg:hidden ${
          // Visibility must flip instantly on open or the links cannot take focus;
          // on close it waits for the fade.
          open
            ? "visible opacity-100 transition-opacity"
            : "invisible opacity-0 transition-[opacity,visibility]"
        }`}
      >
        <nav aria-label="Mobile">
          <ul>
            {links.map((l) => (
              <li key={l.href} className="border-b border-line">
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-16 items-center py-4 font-display text-4xl font-light tracking-tight sm:text-5xl"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/#contact"
          onClick={() => setOpen(false)}
          className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-ink sm:w-fit"
        >
          Book a demo
        </Link>
      </div>
    </>
  );
}
