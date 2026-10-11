// A month of sales at a made-up optician, for the Data screen and for the
// assistant that answers questions about it. Every figure is invented. The
// categories and their colours are the product's.

export const CATEGORIES = [
  { id: "frame", name: "Frame", color: "#ee1890" },
  { id: "lens", name: "Lens", color: "#689bf7" },
  { id: "contact", name: "Contact Lens", color: "#6ad9ac" },
  { id: "accessories", name: "Accessories", color: "#f4b900" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const COLOR = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.color]),
) as Record<CategoryId, string>;

/** What each category took on each day of October, in dollars. */
export const DAILY: Record<CategoryId, number[]> = {
  lens: [
    420, 380, 1080, 950, 890, 935, 390, 560, 530, 440, 610, 720, 980, 860, 400,
    470, 650, 790, 1010, 930, 880, 360, 520, 700, 760, 940, 1040, 820, 450, 580,
    690,
  ],
  frame: [
    170, 265, 590, 815, 550, 410, 235, 470, 505, 410, 380, 520, 640, 700, 260,
    300, 450, 560, 720, 690, 610, 220, 340, 480, 530, 650, 760, 600, 280, 390,
    470,
  ],
  contact: [
    0, 0, 0, 0, 0, 40, 0, 0, 45, 0, 0, 30, 0, 60, 0, 0, 0, 35, 0, 50, 0, 0, 0,
    40, 0, 0, 55, 0, 0, 30, 0,
  ],
  accessories: [
    0, 10, 0, 5, 0, 0, 15, 0, 10, 0, 5, 0, 0, 20, 0, 0, 10, 0, 5, 0, 15, 0, 0,
    10, 0, 5, 0, 0, 10, 0, 5,
  ],
};

/** The days, as the charts label them. */
export const DATES = DAILY.lens.map(
  (_, day) => `${String(day + 1).padStart(2, "0")}/10`,
);

/** Everything taken on each day. */
export const REVENUE = DATES.map((_, day) =>
  CATEGORIES.reduce((sum, c) => sum + DAILY[c.id][day], 0),
);

const TOTAL = REVENUE.reduce((sum, day) => sum + day, 0);

/** Income for the last three months: the two before, then this one. */
export const MONTHS: [name: string, income: number][] = [
  ["August", 33480],
  ["September", 35060],
  ["October", TOTAL],
];

/** How October differs from September, category by category. */
export const CHANGES: [what: string, by: number][] = [
  ["Lenses", 1640],
  ["Frames", 720],
  ["Contact lenses", -205],
];

/** The best sellers, by how many were sold. */
export const ITEMS: { name: string; category: CategoryId; sold: number }[] = [
  { name: "Classic frame (S)", category: "frame", sold: 95 },
  { name: "Clear 1.56", category: "lens", sold: 39 },
  { name: "Photochromic 1.61", category: "lens", sold: 29 },
  { name: "Rimless frame (G)", category: "frame", sold: 16 },
  { name: "Anti-glare 1.60", category: "lens", sold: 11 },
  { name: "Classic frame (G)", category: "frame", sold: 10 },
  { name: "Photochromic 1.56", category: "lens", sold: 10 },
  { name: "Blue-cut 1.56", category: "lens", sold: 8 },
  { name: "Daily contacts", category: "contact", sold: 6 },
  { name: "Delivery fee", category: "accessories", sold: 5 },
  { name: "Titanium frame", category: "frame", sold: 4 },
  { name: "Thin 1.67", category: "lens", sold: 4 },
  { name: "Lens cleaner", category: "accessories", sold: 3 },
  { name: "Polarised grey", category: "lens", sold: 3 },
];

/** What women and men spent on the products that earn the most, in dollars. */
export const BY_GENDER: { name: string; female: number; male: number }[] = [
  { name: "Classic frame (S)", female: 2010, male: 530 },
  { name: "Photochromic 1.61", female: 1770, male: 455 },
  { name: "Clear 1.56", female: 1130, male: 205 },
  { name: "Anti-glare 1.60", female: 640, male: 230 },
  { name: "Rimless frame (G)", female: 505, male: 115 },
  { name: "Classic frame (G)", female: 390, male: 45 },
];

/** The clients who have bought the most frames and lenses, best first. */
export const CLIENTS: {
  name: string;
  items: number;
  visits: number;
  tier: "Diamond" | "Gold";
}[] = [
  { name: "Sokha", items: 69, visits: 31, tier: "Diamond" },
  { name: "Bopha", items: 56, visits: 27, tier: "Diamond" },
  { name: "Rithy", items: 47, visits: 22, tier: "Diamond" },
  { name: "Chantha", items: 41, visits: 20, tier: "Diamond" },
  { name: "Dara", items: 32, visits: 19, tier: "Gold" },
  { name: "Sreyneang", items: 32, visits: 16, tier: "Gold" },
];

export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
