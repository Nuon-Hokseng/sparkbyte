export type SlideState = "active" | "past" | "next";

// Each piece of a slide's text comes in a little after the one before it.
const DELAYS = ["delay-100", "delay-200", "delay-300"] as const;

/**
 * The classes that move one piece of a carousel slide's text, `order` being
 * its place in the slide: 0 the headline, 1 the sentence, 2 the hint.
 *
 * The slide that is going leaves all at once and quickly, lifting away and
 * softening as it fades. The slide that is coming settles into place, from
 * the side the scroll is coming from, out of the same softness, one piece
 * after another, on the page's own easing. The softness hides the moment the
 * two are both on their way, which a plain fade does not.
 *
 * Tailwind sets movement with the `translate` property, not `transform`, so
 * that is what is transitioned.
 */
export function slideText(state: SlideState, order: 0 | 1 | 2) {
  const base =
    "transition-[opacity,translate,filter] motion-reduce:transition-none";
  if (state === "active") {
    return `${base} ${DELAYS[order]} duration-700 ease-[cubic-bezier(0.2,0.7,0.2,1)]`;
  }
  return `${base} pointer-events-none opacity-0 blur-sm duration-300 ease-in ${
    state === "past" ? "-translate-y-3" : "translate-y-4"
  }`;
}
