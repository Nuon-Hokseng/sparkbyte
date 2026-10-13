"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon, StatusBar, TabBar, type ScreenProps } from "../parts";
import { useScript } from "@/hooks/use-script";

type Message = { mine: boolean; text: string };

const CHATS = [
  { name: "Dara Sok", time: "9:22", unread: 1 },
  { name: "Dara Kim", time: "10:32", unread: 2 },
  { name: "Lina Phan", time: "14:22", unread: 12 },
  { name: "Kanha Touch", time: "16:32", unread: 23 },
];
const LAST = "Hello! Yes, this land is still available.";
const THREAD: Message[] = [
  { mine: true, text: "Hi, is the land near Ring Road 3 still available?" },
  { mine: false, text: LAST },
  { mine: true, text: "Can I come and see it this weekend?" },
  { mine: false, text: "Of course. Saturday morning works for me." },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join("");

/** The round picture beside a name: here, the name's initials. */
function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-[4.4em] shrink-0 place-items-center rounded-full bg-[#e9ebf0] text-mock-mute">
      <span className="text-[1.5em] font-semibold">{initials(name)}</span>
    </span>
  );
}

/**
 * The Chat tab: the list of conversations, then one of them opened. The open
 * conversation says, twice, that it is end-to-end encrypted: under the
 * seller's name, and in the note the thread starts with.
 */
export function Chat({ play, settled, go }: ScreenProps) {
  // The conversation that is open, by its place in the list, or -1 for none.
  const [open, setOpen] = useState(settled ? 0 : -1);
  const [thread, setThread] = useState(settled ? THREAD : THREAD.slice(0, 2));
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);

  const say = (message: Message) => {
    setTyping(false);
    setThread((all) => [...all, message]);
  };

  const stop = useScript(play, () => [
    [1700, () => setOpen(0)],
    [1300, () => say(THREAD[2])],
    [700, () => setTyping(true)],
    [1300, () => say(THREAD[3])],
  ]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread, typing, open]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    stop();
    say({ mine: true, text });
    setDraft("");
  };

  const chat = CHATS[Math.max(0, open)];

  return (
    <div className="relative size-full bg-white">
      <StatusBar />

      {/* The list of conversations. */}
      <button
        type="button"
        aria-label="Back to the map"
        onClick={() => go("map")}
        className="absolute left-[1.7em] top-[6.3em] text-mock-mute"
      >
        <Icon name="back" className="size-[2.2em]" />
      </button>
      <p className="absolute inset-x-0 top-[2.65em] text-center text-[2.2em] font-bold leading-tight">
        Chat
      </p>
      <div className="absolute inset-x-[1.6em] top-[11.2em] pr-[0.4em]">
        {CHATS.map((c, i) => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              stop();
              setOpen(i);
            }}
            className="flex h-[6.8em] w-full items-center gap-[0.8em] border-b-[0.1em] border-mock-line pl-[1.2em] pr-[1.2em] text-left"
          >
            <Avatar name={c.name} />
            <span className="min-w-0 flex-1">
              <span className="block text-[1.5em] font-semibold leading-tight">
                {c.name}
              </span>
              <span className="mt-[0.9em] block truncate text-[1.3em] leading-tight text-mock-mute">
                {LAST}
              </span>
            </span>
            <span className="flex flex-col items-end gap-[1em]">
              <span className="text-[1.2em] font-bold leading-none tabular-nums text-black">
                {c.time}
              </span>
              <span className="grid h-[2.4em] min-w-[2.4em] place-items-center rounded-full bg-mock-accent px-[0.5em] text-white">
                <span className="text-[1.1em] font-semibold leading-none tabular-nums">
                  {c.unread}
                </span>
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* One conversation, sliding in over the list. */}
      <div
        inert={open < 0}
        className={`absolute inset-x-0 bottom-[9.6em] top-0 flex flex-col bg-white pt-[4.6em] transition-[translate] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          open < 0 ? "translate-x-full" : ""
        }`}
      >
        <div className="flex items-center gap-[1.2em] border-b-[0.1em] border-mock-line px-[1.7em] pb-[1.2em] pt-[0.8em]">
          <button
            type="button"
            aria-label="Back to all chats"
            onClick={() => {
              stop();
              setOpen(-1);
            }}
            className="text-mock-mute"
          >
            <Icon name="back" className="size-[2.2em]" />
          </button>
          <Avatar name={chat.name} />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[1.5em] font-semibold">{chat.name}</span>
            <span className="mt-[0.2em] flex items-center gap-[0.4em] text-mock-accent">
              <Icon name="lock" className="size-[1.4em]" />
              <span className="text-[1.2em] font-medium">
                End-to-end encrypted
              </span>
            </span>
          </span>
        </div>

        <div
          ref={list}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-[1em] overflow-y-auto bg-mock-fog px-[1.7em] py-[1.6em]"
        >
          <p className="mx-auto mb-[0.6em] flex max-w-[30em] items-start gap-[0.8em] rounded-[1.2em] bg-mock-accent-soft px-[1.3em] py-[1em] text-mock-accent">
            <Icon name="lock" className="mt-[0.1em] size-[1.6em]" />
            <span className="text-[1.2em] font-medium leading-snug">
              Messages in this chat are end-to-end encrypted. Only you and{" "}
              {chat.name.split(" ")[0]} can read them.
            </span>
          </p>
          {thread.map((message, i) => (
            <p
              key={i}
              className={`max-w-[29em] animate-[mock-in_0.35s_ease-out] rounded-[1.6em] px-[1.4em] py-[1em] ${
                message.mine
                  ? "self-end rounded-br-[0.4em] bg-mock-accent text-white"
                  : "self-start rounded-bl-[0.4em] border-[0.1em] border-mock-line bg-white"
              }`}
            >
              <span className="block text-[1.4em] leading-snug">
                {message.text}
              </span>
            </p>
          ))}
          {typing && (
            <p
              aria-label={`${chat.name} is typing`}
              className="flex animate-[mock-in_0.3s_ease-out] gap-[0.5em] self-start rounded-[1.6em] rounded-bl-[0.4em] border-[0.1em] border-mock-line bg-white px-[1.5em] py-[1.5em]"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  style={{ animationDelay: `${dot * 160}ms` }}
                  className="size-[0.7em] animate-[typing_1s_ease-in-out_infinite] rounded-full bg-mock-mute"
                />
              ))}
            </p>
          )}
        </div>

        <form
          onSubmit={send}
          className="flex items-center gap-[1em] border-t-[0.1em] border-mock-line px-[1.7em] py-[1.2em]"
        >
          <input
            value={draft}
            maxLength={60}
            placeholder="Message"
            aria-label={`Message to ${chat.name}`}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={stop}
            className="h-[3.2em] min-w-0 flex-1 rounded-full border-[0.1em] border-mock-line bg-white px-[1.2em] text-[1.35em] outline-none transition-colors placeholder:text-mock-mute/70 focus:border-mock-accent"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim()}
            className="grid size-[4.3em] shrink-0 place-items-center rounded-full bg-mock-accent text-white transition-opacity disabled:opacity-40"
          >
            <Icon name="send" className="size-[2em]" />
          </button>
        </form>
      </div>

      <TabBar on="Chat" go={go} />
    </div>
  );
}
