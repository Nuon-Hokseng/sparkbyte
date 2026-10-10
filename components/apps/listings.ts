// The sample properties the app's screens show, as in the app's own design.

export type Listing = {
  id: string;
  kind: "house" | "land" | "condo";
  price: number;
  /** Rooms and size, as the app prints them on a card. */
  specs: string;
  title: string;
  address: string;
  by: string;
  /** Its photo, public/apps/<photo>.webp, and that file's size in px. */
  photo: string;
  photoSize: [width: number, height: number];
  /** Its pin on the map, in em from the screen's top left corner. */
  at: [x: number, y: number];
  /** Newly listed: its pin is a label saying so. */
  fresh?: boolean;
};

export const listings: Listing[] = [
  {
    id: "land",
    kind: "land",
    price: 105400,
    specs: "1670 m²",
    title: "Land for sale",
    address: "Near Ring Road 3, Kandal Steung District.",
    by: "Pisal",
    photo: "land",
    photoSize: [634, 160],
    at: [18.4, 56.5],
    fresh: true,
  },
  {
    id: "house",
    kind: "house",
    price: 125500,
    specs: "4 bds | 5 ba | 115.5 m²",
    title: "House for sale",
    address: "Chroy Changva district, along National Road No. 6.",
    by: "Devin",
    photo: "house",
    photoSize: [816, 160],
    at: [30.05, 29.15],
  },
  {
    id: "condo",
    kind: "condo",
    price: 65500,
    specs: "Studio | 1 ba | 32.5 m²",
    title: "Condo for sale",
    address: "Chamkar Mon district, near Norodom Boulevard.",
    by: "Lina",
    photo: "condo",
    photoSize: [816, 160],
    at: [26.45, 43.75],
  },
];

export const KIND = { house: "House", land: "Land", condo: "Condo" };

export const price = (n: number) => `$ ${n.toLocaleString("en-US")}`;
