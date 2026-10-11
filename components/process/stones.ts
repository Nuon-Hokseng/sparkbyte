// "How we work": the four steps everything we make goes through, and the
// stones on the ring around the Earth, one for each thing we have made or
// have yet to make.

export const STEPS: { name: string; text: string }[] = [
  {
    name: "Listen",
    text: "We come to your shop and watch a working day before we suggest anything.",
  },
  {
    name: "Shape",
    text: "You get the screens as a mock you can click through, and change them until they fit.",
  },
  {
    name: "Build",
    text: "We release it in parts, so you are using the first while we finish the rest.",
  },
  {
    name: "Stay",
    text: "We install it, train your staff and stay on call long after launch.",
  },
];

/** A stone's colours: its bright heart, its body, and its depths. */
type Colors = [light: string, mid: string, dark: string];

export type Stone = {
  id: string;
  name: string;
  /** Where it stands, in a word or two. */
  status: string;
  text: string;
  /** How many of the steps it has been through. The one after is under way. */
  done: number;
  link: { href: string; label: string };
  color: Colors;
  /** Made, and so lit from within. One yet to be made is still dark. */
  made: boolean;
};

const dark = (n: number, color: Colors): Stone => ({
  id: `dark-${n}`,
  name: "Not made yet",
  status: "Waiting",
  text: "This stone is still dark. Tell us what your business needs, and it could be the next one we light.",
  done: 0,
  link: { href: "/#contact", label: "Book a demo" },
  color,
  made: false,
});

/**
 * The stones, in their order round the ring: six, each its own colour. Two
 * are made so far.
 */
export const STONES: Stone[] = [
  {
    id: "pos",
    name: "SparkByte POS",
    status: "Made",
    text: "Our first stone: a point of sale that a shop sets up for itself, with its own data and an assistant to ask about it.",
    done: 4,
    link: { href: "/#pos", label: "See the POS" },
    color: ["#ffb3b9", "#f0152f", "#5c000d"],
    made: true,
  },
  dark(1, ["#e9bcff", "#9a2bff", "#31085f"]),
  dark(2, ["#fff4b0", "#ffc21a", "#7a4800"]),
  {
    id: "tilomnov",
    name: "TilomNov",
    status: "Release soon",
    text: "Our second stone: a property app for Cambodia, with the map, the chat and the listings in place and the last stretch under way.",
    done: 2,
    link: { href: "/#apps", label: "See the app" },
    color: ["#b5dbff", "#1f6bff", "#081a5e"],
    made: true,
  },
  dark(3, ["#b6ffc9", "#17c94a", "#05401a"]),
  dark(4, ["#ffd9b0", "#ff7a12", "#6b2600"]),
];
