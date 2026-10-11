// What the app tour says: one slide per screen of TilomNov shown in the phone.
// The screens themselves are in screens/. The words are kept few: a headline
// in two short halves, one sentence, and what to try.

export type TourId = "welcome" | "map" | "chat" | "explore" | "detail";

export type TourSlide = {
  id: TourId;
  /** The screen's name in the list of steps. */
  tab: string;
  /** The headline: how it opens, then the brighter half that carries it. */
  lead: string;
  accent: string;
  body: string;
  /** What the visitor can try on the phone. */
  hint: string;
};

export const tour: TourSlide[] = [
  {
    id: "welcome",
    tab: "Welcome",
    lead: "TilomNov.",
    accent: "Property, mapped.",
    body: "Find and share property by its exact place on the map.",
    hint: "Tap Explore without account",
  },
  {
    id: "map",
    tab: "Map",
    lead: "Search the map.",
    accent: "See what is for sale.",
    body: "Every listing is a pin. Every pin has a card.",
    hint: "Tap a pin",
  },
  {
    id: "chat",
    tab: "Chat",
    lead: "Message the seller.",
    accent: "Privately.",
    body: "End-to-end encrypted. Only the two of you can read it.",
    hint: "Send a message",
  },
  {
    id: "explore",
    tab: "Explore",
    lead: "Prefer a list?",
    accent: "It is here too.",
    body: "The same listings, to sort and scroll.",
    hint: "Scroll the list",
  },
  {
    id: "detail",
    tab: "Property",
    lead: "One property.",
    accent: "Everything about it.",
    body: "Photos, price, size and place. The seller is one tap away.",
    hint: "Tap Chat with seller",
  },
];
