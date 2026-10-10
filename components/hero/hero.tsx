import Link from "next/link";
import { BlackHole } from "./black-hole/black-hole";
import { HeroHeadline } from "./hero-headline";
import { SpaceBackdrop } from "./space-backdrop/space-backdrop";

const facts = [
  {
    title: "Point-of-sale systems",
    text: "Checkout, stock and reports in one place.",
  },
  {
    title: "Mobile apps",
    text: "For iOS and Android, under your brand.",
  },
  {
    title: "Setup and support",
    text: "We install, train your staff and stay on call.",
  },
];

export function Hero() {
  return (
    // No stacking context here or above: the mark's canvas is fixed over the
    // whole page so it can fly up into the header.
    <section
      id="top"
      className="relative flex min-h-svh flex-col overflow-hidden bg-ink"
    >
      <SpaceBackdrop
        focus="[data-bh-anchor]"
        className="absolute inset-0 z-0 size-full"
      />

      <div className="mx-auto grid w-full max-w-360 flex-1 grid-cols-1 content-center px-5 pt-[calc(4rem+env(safe-area-inset-top))] sm:px-8 lg:grid-cols-12 lg:content-center lg:px-16 lg:pt-[calc(5rem+env(safe-area-inset-top))]">
        <div className="mx-auto mb-2 w-[min(100%,26rem,60svh)] sm:w-[min(100%,30rem,60svh)] lg:col-start-7 lg:col-end-13 lg:row-start-1 lg:mx-0 lg:mb-0 lg:w-full lg:max-w-140 lg:justify-self-end xl:max-w-150">
          {/* The mark rests in this box until scrolling carries it to the header. */}
          <BlackHole className="aspect-square w-full" />
        </div>

        <div className="relative z-10 pb-12 sm:pb-16 lg:col-start-1 lg:col-end-8 lg:row-start-1 lg:py-24">
          <HeroHeadline
            text="The till and the app, built together."
            className="max-w-[14ch] text-balance font-display text-[clamp(2.75rem,min(12vw,14svh),4.5rem)] font-light leading-[0.98] tracking-[-0.035em] lg:max-w-[12ch] lg:text-[clamp(4.5rem,7vw,6.75rem)]"
          />
          <p className="mt-6 max-w-136 text-pretty text-lg leading-relaxed text-mist sm:mt-8 sm:text-xl">
            SparkByte builds point-of-sale systems and mobile apps for shops,
            cafés and restaurants. One team, from the checkout counter to your
            customer&apos;s phone.
          </p>
          <div className="mt-8 flex flex-col items-start gap-6 sm:mt-10 sm:flex-row sm:items-center sm:gap-8">
            <Link
              href="/#contact"
              className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-ink transition-colors hover:bg-mist"
            >
              Book a demo
            </Link>
            <Link
              href="/#pos"
              className="border-b border-silver/60 pb-1 text-base font-medium transition-colors hover:border-white"
            >
              See what we build
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-line">
        <dl className="mx-auto grid w-full max-w-360 grid-cols-1 px-5 sm:px-8 md:grid-cols-3 lg:px-16">
          {facts.map((f, i) => (
            <div
              key={f.title}
              className={`py-5 md:py-7 ${
                i > 0
                  ? "border-t border-line md:border-l md:border-t-0 md:pl-7"
                  : "md:pr-7"
              }`}
            >
              <dt className="text-[1.0625rem] font-medium">{f.title}</dt>
              <dd className="mt-1 text-[0.9375rem] leading-snug text-silver">
                {f.text}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
