"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { site } from "@/lib/site";

const KINDS = ["Optician", "Retail or coffee", "Restaurant", "Something else"];
const WANTS = ["POS system", "Mobile app"];

// What happens once the message is sent. It is a sequence, so it is numbered.
const NEXT = ["You write.", "We call.", "You see it working."];

const { email, phone, telegram } = site.contact;

/** The other ways to reach us. One that has not been filled in is left out. */
const CHANNELS = [
  { name: "Email", value: email, href: `mailto:${email}` },
  { name: "Telegram", value: `@${telegram}`, href: `https://t.me/${telegram}` },
  { name: "Phone", value: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` },
].filter((_, i) => [email, telegram, phone][i]);

const FIELD =
  "mt-2 block w-full rounded-xl bg-white/5 px-4 text-base text-white ring-1 ring-white/15 transition-shadow placeholder:text-silver/60 hover:ring-white/30 focus:outline-none focus:ring-2 focus:ring-white/70";
const CHIP =
  "flex min-h-11 cursor-pointer items-center rounded-full px-4 text-[0.9375rem] font-medium text-mist ring-1 ring-white/15 transition-colors hover:ring-white/40 has-checked:bg-white has-checked:text-ink has-checked:ring-white has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-white";

/**
 * Contact: a short form that writes the visitor's email for them, and the
 * other ways to reach us. There is no server behind the form. Sending opens
 * the visitor's own email app with the message filled in, and afterwards the
 * message can be copied instead, for anyone whose email app did not open.
 */
export function Contact() {
  // The message as it was written out, once the form has been sent.
  const [sent, setSent] = useState("");
  // Whether copying it worked, once that has been tried.
  const [copied, setCopied] = useState<"" | "yes" | "no">("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const wants = data.getAll("wants").join(" and ");

    const message = [
      `Name: ${text("name")}`,
      text("business") && `Business: ${text("business")}`,
      text("kind") && `Kind of business: ${text("kind")}`,
      wants && `Interested in: ${wants}`,
      `Reach me on: ${text("reach")}`,
      text("note") && `\n${text("note")}`,
    ]
      .filter(Boolean)
      .join("\n");

    setSent(message);
    setCopied("");
    const subject = `Demo request from ${text("business") || text("name")}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(message)}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sent);
      setCopied("yes");
    } catch {
      // The browser would not let us: show the message, to be copied by hand.
      setCopied("no");
    }
  };

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden border-t border-line bg-ink"
    >
      {/* A low light behind the form, like the one the planet sits in. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-20%] top-[10%] size-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgba(199,214,255,0.07),transparent)]"
      />

      {/* On a wide screen the section is as tall as the screen under the
          header, with everything in the middle of it: arriving here shows
          the whole form, down to its button. */}
      <div className="relative mx-auto grid w-full max-w-360 gap-y-12 px-5 py-20 sm:px-8 lg:min-h-[calc(100svh-5rem)] lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:px-16 lg:py-8 short:lg:py-4">
        <div className="lg:col-span-5">
          <h2
            id="contact-title"
            className="font-display text-xl font-normal tracking-tight text-mist sm:text-2xl"
          >
            Contact
          </h2>
          <p className="mt-4 text-balance font-display text-[1.75rem] font-light leading-[1.06] tracking-[-0.035em] text-silver sm:mt-6 sm:text-[2.75rem] lg:text-[clamp(2.75rem,3.9vw,3.75rem)] lg:leading-[1.02]">
            Tell us how you work.{" "}
            <span className="block text-white">See it built for you.</span>
          </p>

          <ol className="mt-8 max-w-104 lg:mt-10">
            {NEXT.map((step, i) => (
              <li
                key={step}
                className="grid grid-cols-[2.5rem_1fr] border-t border-line py-4 text-[0.9375rem] leading-snug text-mist"
              >
                <span className="font-display text-xs font-semibold tabular-nums leading-5 tracking-wide text-silver/70">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10">
            {CHANNELS.map((channel) => (
              <div key={channel.name}>
                <dt className="text-sm text-silver">{channel.name}</dt>
                <dd className="mt-1">
                  <a
                    href={channel.href}
                    className="border-b border-silver/60 pb-0.5 text-[1.0625rem] font-medium transition-colors hover:border-white"
                  >
                    {channel.value}
                  </a>
                </dd>
              </div>
            ))}
            <div>
              <dt className="text-sm text-silver">Based in</dt>
              <dd className="mt-1 text-[1.0625rem] font-medium">
                {site.location}
              </dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={submit}
          className="rounded-3xl bg-white/5 p-5 ring-1 ring-white/12 sm:p-8 lg:col-span-7 lg:col-start-6 short:lg:p-6"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-mist">
              Name
              <input
                name="name"
                required
                autoComplete="name"
                className={`h-12 short:lg:h-11 ${FIELD}`}
              />
            </label>
            <label className="block text-sm text-mist">
              Business
              <input
                name="business"
                autoComplete="organization"
                className={`h-12 short:lg:h-11 ${FIELD}`}
              />
            </label>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm text-mist">Kind of business</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {KINDS.map((kind) => (
                <label key={kind} className={CHIP}>
                  <input
                    type="radio"
                    name="kind"
                    value={kind}
                    className="sr-only"
                  />
                  {kind}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm text-mist">Interested in</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WANTS.map((want) => (
                <label key={want} className={CHIP}>
                  <input
                    type="checkbox"
                    name="wants"
                    value={want}
                    className="sr-only"
                  />
                  {want}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 block text-sm text-mist">
            Phone or Telegram
            <input
              name="reach"
              required
              autoComplete="tel"
              inputMode="text"
              className={`h-12 short:lg:h-11 ${FIELD}`}
            />
          </label>

          <label className="mt-5 block text-sm text-mist">
            Message
            <textarea
              name="note"
              rows={3}
              placeholder="Optional"
              className={`resize-y py-3 leading-relaxed ${FIELD}`}
            />
          </label>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 short:lg:mt-5">
            <button
              type="submit"
              className="inline-flex h-14 shrink-0 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-ink transition-colors hover:bg-mist"
            >
              Book a demo
            </button>
            <p className="text-sm leading-snug text-silver">
              Opens your email app, ready to send.
            </p>
          </div>

          <div aria-live="polite">
            {sent && (
              <div className="mt-6 animate-[mock-in_0.35s_ease-out] rounded-2xl bg-white/5 p-5 ring-1 ring-white/12 motion-reduce:animate-none">
                <p className="text-[0.9375rem] leading-relaxed text-mist">
                  Email app did not open? Copy the message and send it to{" "}
                  <a
                    href={`mailto:${email}`}
                    className="border-b border-silver/60 font-medium text-white"
                  >
                    {email}
                  </a>
                  .
                </p>
                <button
                  type="button"
                  onClick={copy}
                  className="mt-4 inline-flex h-11 items-center rounded-full px-5 text-[0.9375rem] font-medium ring-1 ring-white/25 transition-colors hover:ring-white/60"
                >
                  {copied === "yes" ? "Message copied" : "Copy the message"}
                </button>
                {copied === "no" && (
                  <label className="mt-4 block text-sm text-mist">
                    Copy was blocked. Select the message here.
                    <textarea
                      readOnly
                      rows={6}
                      value={sent}
                      onFocus={(e) => e.currentTarget.select()}
                      className={`resize-y py-3 leading-relaxed ${FIELD}`}
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
