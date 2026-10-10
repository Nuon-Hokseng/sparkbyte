// What the app tour says: one slide per screen of TilomNov shown in the phone.
// The screens themselves are in screens/.

export type TourId = "welcome" | "map" | "chat" | "explore" | "detail";

export type TourSlide = {
  id: TourId;
  /** The screen's name in the list of steps, and a few words under it. */
  tab: string;
  caption: string;
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
    caption: "The first screen",
    lead: "Meet TilomNov,",
    accent: "our property app",
    body: "Find and share properties with their exact place on the map. Look around straight away, or log in to save listings and post your own.",
    hint: "Try it: tap Explore without account",
  },
  {
    id: "map",
    tab: "Map",
    caption: "Pins and cards",
    lead: "Search the map,",
    accent: "see what is for sale",
    body: "Every listing is a pin. Move around the map to look at an area, and swipe the cards along the bottom to go through what is there.",
    hint: "Try it: tap a pin or swipe the cards",
  },
  {
    id: "chat",
    tab: "Chat",
    caption: "Encrypted messages",
    lead: "Message the seller,",
    accent: "encrypted end to end",
    body: "Ask about a property without leaving the app. Messages are end-to-end encrypted, so only the two of you can read them.",
    hint: "Try it: open a chat and send a message",
  },
  {
    id: "explore",
    tab: "Explore",
    caption: "The same, as a list",
    lead: "Prefer a list?",
    accent: "Explore has one",
    body: "The same listings as a list to sort and scroll, for anyone who would rather not pan a map. One tap goes back to the map.",
    hint: "Try it: scroll the list, or save a listing",
  },
  {
    id: "detail",
    tab: "Property",
    caption: "One listing, in full",
    lead: "One property,",
    accent: "everything about it",
    body: "Tap any card for the photos, the price, the size and where it is. The seller is one tap away, and nothing else on the screen competes for attention.",
    hint: "Try it: tap Chat with seller",
  },
];
