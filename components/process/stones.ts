// "How we work": the four steps everything we make goes through, and the
// stones on the ring around the Earth, one for each thing we have made or
// have yet to make.

export const STEPS: { name: string; text: string }[] = [
  {
    name: "Listen",
    text: "We watch a working day first.",
  },
  {
    name: "Shape",
    text: "You try the screens before we build.",
  },
  {
    name: "Build",
    text: "Released in parts, so you start early.",
  },
  {
    name: "Stay",
    text: "Installed, taught and on call.",
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
  text: "Still dark. The next one could be yours.",
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
    text: "A point of sale that shops set up themselves.",
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
    text: "A property app for Cambodia. Nearly there.",
    done: 2,
    link: { href: "/#apps", label: "See the app" },
    color: ["#b5dbff", "#1f6bff", "#081a5e"],
    made: true,
  },
  dark(3, ["#b6ffc9", "#17c94a", "#05401a"]),
  dark(4, ["#ffd9b0", "#ff7a12", "#6b2600"]),
];
