"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { LineChart } from "./charts";
import { PANEL, useScript, type DemoProps } from "./kit";
import {
  CHANGES,
  CLIENTS,
  COLOR,
  DATES,
  ITEMS,
  MONTHS,
  REVENUE,
  usd,
} from "./sales";

/** A line of figures in an answer: what, how much, and which way it went. */
type Row = { label: string; value: string; went?: "up" | "down"; note?: string };
type Answer = { text: string; rows?: Row[]; more?: string };
type Message = { from: "me"; text: string } | ({ from: "ai" } & Answer);

const signed = (n: number) => `${n < 0 ? "−" : "+"}${usd(Math.abs(n))}`;
const went = (n: number): Row["went"] => (n < 0 ? "down" : "up");

const [, september, october] = MONTHS.map(([, income]) => income);
const best = MONTHS.reduce((a, b) => (b[1] > a[1] ? b : a));

// The questions on offer, and what the assistant makes of this shop's
// figures for each. In the POS the answers are written from the shop's own
// sales; here they are worked out from the same made-up month the Data
// screen charts.
const QUESTIONS: { ask: string; answer: Answer }[] = [
  {
    ask: "What did I earn in each of the last three months?",
    answer: {
      text: "Here is your income, month by month:",
      rows: MONTHS.map(([name, income], i) => {
        const change = i ? income - MONTHS[i - 1][1] : 0;
        return {
          label: name,
          value: usd(income),
          went: i ? went(change) : undefined,
          note: i
            ? `${signed(change)} (${((change / MONTHS[i - 1][1]) * 100).toFixed(1)}%)`
            : undefined,
        };
      }),
      more: `${best[0]} was the best of the three.`,
    },
  },
  {
    ask: "Where did I gain and lose in October?",
    answer: {
      text: "Against September, October went like this:",
      rows: [
        ...CHANGES.map(([label, by]) => ({
          label,
          value: signed(by),
          went: went(by),
        })),
        {
          label: "Overall",
          value: signed(october - september),
          went: went(october - september),
        },
      ],
      more: "Lenses did the most for you. Contact lenses are the one line that fell.",
    },
  },
  {
    ask: "Which products and customers should I focus on?",
    answer: {
      text: `${ITEMS[0].name} is far ahead: ${ITEMS[0].sold} sold, more than the next three items together. Keep it in stock in every size.`,
      more: `${CLIENTS[0].name}, ${CLIENTS[1].name} and ${CLIENTS[2].name} are your most loyal clients, with ${CLIENTS[0].items}, ${CLIENTS[1].items} and ${CLIENTS[2].items} items each. An offer for returning clients would reach the people who already buy most.`,
    },
  },
  {
    ask: "Suggest a plan for the next 3 months.",
    answer: {
      text: "Three things, from your numbers:",
      rows: [
        { label: "1", value: "Pair your best frame with a lens offer" },
        { label: "2", value: "Bring contact lenses back up with a refill reminder" },
        { label: "3", value: "Reward your top clients for coming back" },
      ],
      more: "Ask me again next month and I will compare the results.",
    },
  },
];

// To anything else: there is no model behind this page to ask.
const ELSE: Answer = {
  text: "In the POS I answer from your own sales. This demo only knows the questions below, so try one of those.",
};

/** How long the assistant takes over an answer, in ms. */
const THINKS = 950;

/**
 * The assistant that floats over the POS's Data screen. Ask it one of the
 * questions it offers and it answers from the month's figures, which are
 * charted beside it.
 */
export function Assistant({ play, settled }: DemoProps) {
  const [messages, setMessages] = useState<Message[]>(
    settled
      ? [
          { from: "me", text: QUESTIONS[0].ask },
          { from: "ai", ...QUESTIONS[0].answer },
        ]
      : [],
  );
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const pending = useRef<number[]>([]);

  const ask = (text: string) => {
    const answer = QUESTIONS.find((q) => q.ask === text)?.answer ?? ELSE;
    setMessages((all) => [...all, { from: "me", text }]);
    setThinking(true);
    pending.current.push(
      window.setTimeout(() => {
        setThinking(false);
        setMessages((all) => [...all, { from: "ai", ...answer }]);
      }, THINKS),
    );
  };

  const stop = useScript(play, () => [[1100, () => ask(QUESTIONS[0].ask)]]);

  useEffect(() => {
    const timers = pending.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [messages, thinking]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    ask(text);
  };

  const asked = new Set(messages.map((m) => (m.from === "me" ? m.text : "")));
  const left = QUESTIONS.filter((q) => !asked.has(q.ask));

  return (
    <div
      onPointerDown={stop}
      className={`grid size-full grid-cols-[1fr_23em] gap-[1.2em] bg-mock-fog p-[1.3em] @max-xl:grid-cols-1 @max-xl:p-[1em] ${PANEL}`}
    >
      {/* What it is asked about: the month, as the Data screen shows it. */}
      <div className="flex min-h-0 min-w-0 flex-col gap-[1em] @max-xl:hidden">
        <div className="grid grid-cols-2 gap-[0.8em]">
          {[
            ["October income", usd(october)],
            ["Best seller", ITEMS[0].name],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[0.9em] border border-mock-line bg-mock-card px-[1em] py-[0.9em]"
            >
              <p className="text-[0.68em] leading-none text-mock-mute">{label}</p>
              <p className="mt-[0.5em] truncate text-[1.15em] font-semibold leading-none tabular-nums">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col rounded-[0.9em] border border-mock-line bg-mock-card p-[1.1em]">
          <p className="pb-[0.9em] text-[0.95em] font-semibold leading-tight">
            Revenue Trend
          </p>
          <LineChart
            series={[{ name: "Revenue", color: COLOR.frame, values: REVENUE }]}
            labels={DATES}
            max={2000}
            ticks={[0, 500, 1000, 1500, 2000]}
            every={4}
            format={usd}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-col overflow-hidden rounded-[1em] border border-mock-line bg-mock-card shadow-[0_1em_2.4em_-1em_rgba(19,24,39,0.35)]">
        <div className="flex items-center gap-[0.8em] border-b border-mock-line px-[1em] py-[0.9em]">
          <span className="grid size-[2.5em] shrink-0 place-items-center rounded-full bg-mock-accent-soft text-mock-accent">
            <Glyph d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20 11.5z" />
          </span>
          <span className="min-w-0 flex-1 leading-none">
            <span className="block text-[0.95em] font-bold">AI assistant</span>
            <span className="mt-[0.4em] block truncate text-[0.68em] text-mock-mute">
              Ask about results and strategy
            </span>
          </span>
          <span aria-hidden="true" className="flex gap-[0.9em] text-mock-mute">
            <Glyph d="M4 12a8 8 0 1 0 2.5-5.8M4 5v4h4M12 8v4.5l3 1.5" />
            <Glyph d="M12 5v14M5 12h14" />
            <Glyph d="M6 6l12 12M18 6L6 18" />
          </span>
        </div>

        <div
          ref={list}
          className="flex min-h-0 flex-1 flex-col gap-[0.7em] overflow-y-auto px-[1em] py-[1em]"
        >
          {messages.map((message, i) =>
            message.from === "me" ? (
              <p
                key={i}
                className="ml-[2em] animate-[mock-in_0.3s_ease-out] self-end rounded-[0.9em] rounded-br-[0.25em] bg-mock-accent px-[0.9em] py-[0.65em] text-[0.78em] leading-snug text-mock-inverse"
              >
                {message.text}
              </p>
            ) : (
              <div
                key={i}
                className="mr-[1.2em] animate-[mock-in_0.3s_ease-out] self-start rounded-[0.9em] rounded-bl-[0.25em] border border-mock-line bg-mock-fog px-[0.9em] py-[0.7em] text-[0.78em] leading-snug"
              >
                <p>{message.text}</p>
                {message.rows && (
                  <ul className="my-[0.6em] flex flex-col gap-[0.35em]">
                    {message.rows.map((row) => (
                      <li
                        key={row.label}
                        className="flex items-baseline gap-[0.7em] rounded-[0.5em] bg-mock-card px-[0.7em] py-[0.5em] leading-tight"
                      >
                        <span className="shrink-0 text-mock-mute">{row.label}</span>
                        <span className="ml-auto text-right font-semibold tabular-nums">
                          {row.went && (
                            <span
                              aria-hidden="true"
                              className={`mr-[0.4em] text-[0.8em] ${
                                row.went === "up" ? "text-mock-go" : "text-[#e5484d]"
                              }`}
                            >
                              {row.went === "up" ? "▲" : "▼"}
                            </span>
                          )}
                          {row.value}
                          {row.note && (
                            <span className="block text-[0.88em] font-normal text-mock-mute">
                              {row.note}
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {message.more && <p className="mt-[0.5em]">{message.more}</p>}
              </div>
            ),
          )}

          {thinking && (
            <p
              aria-label="The assistant is writing"
              className="flex gap-[0.3em] self-start rounded-[0.9em] rounded-bl-[0.25em] border border-mock-line bg-mock-fog px-[0.9em] py-[0.8em]"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  style={{ animationDelay: `${dot * 150}ms` }}
                  className="size-[0.45em] animate-[typing_1s_ease-in-out_infinite] rounded-full bg-mock-mute"
                />
              ))}
            </p>
          )}

          {!thinking && left.length > 0 && (
            <div className="flex flex-col gap-[0.5em]">
              <p className="text-[0.72em] leading-none text-mock-mute">
                {messages.length ? "Ask next:" : "Try asking:"}
              </p>
              {left.map((q) => (
                <button
                  key={q.ask}
                  type="button"
                  onClick={() => {
                    stop();
                    ask(q.ask);
                  }}
                  className="rounded-[0.6em] border border-mock-line bg-[#fafafa] px-[0.9em] py-[0.7em] text-left text-[0.78em] leading-snug transition-colors hover:border-mock-accent"
                >
                  {q.ask}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="flex gap-[0.6em] border-t border-mock-line px-[1em] py-[0.8em]"
        >
          <input
            value={draft}
            maxLength={80}
            placeholder="Ask about your business..."
            aria-label="Ask about your business"
            onChange={(e) => setDraft(e.target.value)}
            onFocus={stop}
            className="h-[2.9em] min-w-0 flex-1 rounded-[0.6em] border border-mock-line px-[0.9em] text-[0.8em] outline-none transition-colors placeholder:text-mock-mute/70 focus:border-mock-accent"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || thinking}
            className="grid size-[2.35em] shrink-0 place-items-center rounded-[0.6em] bg-mock-accent text-mock-inverse transition-colors disabled:bg-[#f8a3d3]"
          >
            <Glyph d="M4 12l16-7-6 16-3-6.5z" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Glyph({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[1.25em] shrink-0"
    >
      <path d={d} />
    </svg>
  );
}
