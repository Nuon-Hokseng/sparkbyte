// What the showcase says: one slide per thing a shop can set up in the POS
// for itself, then what the POS tells it in return. Each slide's live demo is
// in demos/.

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
  /** The headline: how it opens, then the part set in the accent colour. */
  lead: string;
  accent: string;
  body: string;
  /** Three things worth knowing, each a name and a line about it. */
  points: [name: string, text: string][];
  /** What the visitor can try in the demo. */
  hint: string;
  /** The slide's icon: an SVG path on a 24 × 24 grid, drawn as a stroke. */
  icon: string;
};

export const slides: Slide[] = [
  {
    id: "type",
    tab: "Business type",
    lead: "One POS,",
    accent: "three kinds of shop",
    body: "Choose optician, retail and coffee, or restaurant in Settings, and the whole POS changes to match. Your plan decides which types you can switch between.",
    points: [
      ["Optician", "Prescriptions, frames and lenses"],
      ["Retail, coffee", "A quick item grid for a queue"],
      ["Restaurant", "Tables and running bills"],
    ],
    hint: "Try it: pick a business type",
    icon: "M3 9l1.5-5h15L21 9M4.5 9.5V20h15V9.5M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9.5 20v-5.5h5V20",
  },
  {
    id: "fields",
    tab: "Fields",
    lead: "Name the fields",
    accent: "yourself",
    body: "Every product tab has its own form, and you can rename any field in it. Record what your business needs to know, whatever you sell.",
    points: [
      ["Per tab", "Each product tab has its own form"],
      ["Your wording", "Call a field what your shop calls it"],
      ["Saved your way", "Records take the names you chose"],
    ],
    hint: "Try it: click a field name and type your own",
    icon: "M4 20h16M14.5 4.5l3 3L8 17l-4 1 1-4z",
  },
  {
    id: "tabs",
    tab: "Tabs",
    lead: "Add a tab",
    accent: "whenever you need one",
    body: "Create as many product tabs as you like, straight from Settings. No call to support, and no waiting for an update.",
    points: [
      ["No limit", "A tab for every kind of thing you sell"],
      ["Self-service", "Add and remove them in Settings"],
      ["Live at once", "New tabs join the menu straight away"],
    ],
    hint: "Try it: type a name and press Add",
    icon: "M3 7a2 2 0 0 1 2-2h4.5l2 2.5H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM12 11v5M9.5 13.5h5",
  },
  {
    id: "order",
    tab: "Table orders",
    lead: "Open a table,",
    accent: "add what they order",
    body: "Tap a table to start its bill, then add dishes from your menu while the guests eat. They can order from a QR menu too, if you ask us to set one up.",
    points: [
      ["Running bill", "Stays open while the guests eat"],
      ["By category", "Food, drinks and dessert a tap apart"],
      ["QR menu", "Guests order from their seat, on request"],
    ],
    hint: "Try it: tap dishes to add them to Table 6",
    icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  },
  {
    id: "seats",
    tab: "Table sizes",
    lead: "Tables for one, two",
    accent: "or the whole family",
    body: "Say how many floors you have, add tables in batches, and give each one its number of seats.",
    points: [
      ["By floor", "Each floor keeps its own tables"],
      ["In batches", "Add several tables of one size at once"],
      ["Seat by seat", "Adjust any table afterwards"],
    ],
    hint: "Try it: use − and + to change the seats",
    icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18.5 14.2a6.5 6.5 0 0 1 3 5.8",
  },
  {
    id: "floor",
    tab: "Floor plan",
    lead: "A floor plan that",
    accent: "matches your room",
    body: "Drag each table to where it really stands and draw the walls around them. Staff find the right table at a glance, because the screen looks like the restaurant.",
    points: [
      ["Drag to place", "Put each table where it stands"],
      ["Draw the walls", "Kitchen, bar and partitions"],
      ["Easy to read", "The screen looks like the room"],
    ],
    hint: "Try it: drag a table, or switch to Walls and draw",
    icon: "M3.5 4.5h17v15h-17zM3.5 10.5H10M10 4.5V13M14.5 19.5V14h6",
  },
  {
    id: "data",
    tab: "Analytics",
    lead: "Your sales, as",
    accent: "the chart you need",
    body: "The Data screen turns every receipt into charts: revenue day by day, sales by category, your best sellers and your best clients. Pick the one that answers your question.",
    points: [
      ["Revenue trend", "Day by day, through the month"],
      ["Best sellers", "Ranked, and filtered by category"],
      ["Top clients", "Who buys the most from you"],
    ],
    hint: "Try it: switch the chart, or point at a day",
    icon: "M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6",
  },
  {
    id: "ai",
    tab: "AI assistant",
    lead: "Ask your numbers",
    accent: "a question",
    body: "An assistant built into the POS reads your own sales. Ask what you earned each month, where you gained and where you lost, or what to do next, and it answers from your figures.",
    points: [
      ["Your data", "Answers come from your own sales"],
      ["Month by month", "Income, gains and losses compared"],
      ["What next", "A plan for the months ahead"],
    ],
    hint: "Try it: tap a question",
    icon: "M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.4A8 8 0 1 1 20 11.5zM9 10.5h6M9 13.5h3.5",
  },
];
