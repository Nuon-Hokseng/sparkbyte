// What the showcase says: one slide per thing a shop can set up in the POS
// for itself, then what the POS tells it in return. Each slide's live demo is
// in demos/. The words are kept few: a headline in two short halves, one
// sentence, and what to try.

export type SlideId =
  | "type"
  | "fields"
  | "tabs"
  | "order"
  | "seats"
  | "floor"
  | "data"
  | "ai";

export type Slide = {
  id: SlideId;
  /** Short name, read out for the slide's step in the progress row. */
  tab: string;
  /** The headline: how it opens, then the brighter half that carries it. */
  lead: string;
  accent: string;
  body: string;
  /** What the visitor can try in the demo. */
  hint: string;
  /** The slide's icon: an SVG path on a 24 × 24 grid, drawn as a stroke. */
  icon: string;
};

export const slides: Slide[] = [
  {
    id: "type",
    tab: "Business type",
    lead: "One POS.",
    accent: "Every kind of shop.",
    body: "Optician, retail or restaurant. Switch in Settings.",
    hint: "Pick a business type",
    icon: "M3 9l1.5-5h15L21 9M4.5 9.5V20h15V9.5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9.5 20v-5.5h5V20",
  },
  {
    id: "fields",
    tab: "Fields",
    lead: "Your fields.",
    accent: "Your words.",
    body: "Rename any field to match the way you work.",
    hint: "Rename a field",
    icon: "M4 20h16M14.5 4.5l3 3L8 17l-4 1 1-4z",
  },
  {
    id: "tabs",
    tab: "Tabs",
    lead: "Add a tab.",
    accent: "No support call.",
    body: "Create as many product tabs as you need, yourself.",
    hint: "Add a tab",
    icon: "M3 7a2 2 0 0 1 2-2h4.5l2 2.5H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v5M9.5 13.5h5",
  },
  {
    id: "order",
    tab: "Table orders",
    lead: "Open a table.",
    accent: "Take the order.",
    body: "A running bill for every table. QR menu on request.",
    hint: "Tap a dish",
    icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  },
  {
    id: "seats",
    tab: "Table sizes",
    lead: "Every table.",
    accent: "The right size.",
    body: "Floors, tables and seats, set up in seconds.",
    hint: "Change the seats",
    icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 14.2a6.5 6.5 0 0 1 3 5.8",
  },
  {
    id: "floor",
    tab: "Floor plan",
    lead: "Your floor.",
    accent: "On screen.",
    body: "Drag tables and draw walls to match the room.",
    hint: "Drag a table",
    icon: "M3.5 4.5h17v15h-17zM3.5 10.5H10M10 4.5V13M14.5 19.5V14h6",
  },
  {
    id: "data",
    tab: "Analytics",
    lead: "Your sales.",
    accent: "At a glance.",
    body: "Revenue, best sellers and top clients, charted for you.",
    hint: "Switch the chart",
    icon: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  },
  {
    id: "ai",
    tab: "AI assistant",
    lead: "Ask a question.",
    accent: "Your data answers.",
    body: "A built-in assistant that reads your own sales.",
    hint: "Ask a question",
    icon: "M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20 11.5zM9 10.5h6M9 13.5h3.5",
  },
];
