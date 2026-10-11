type Props = {
  /** Which slide this is the line of. */
  index: number;
  /** The stage it belongs to, from `useScrollStage`. */
  stage: { active: number; paged: boolean; timed: boolean; dwell: number };
  /** The line runs downwards, not across. */
  vertical?: boolean;
};

/**
 * The white that fills a step's line in a carousel's progress row.
 *
 * With a mouse it follows the scroll: the stage writes --fill on it, marked
 * as it is with `data-fill`. On a touch screen the slides before the one
 * showing are full, and the one showing fills over the time it has left
 * before the next comes up by itself, or is simply full if the visitor has
 * stopped that clock by touching it.
 */
export function StepFill({ index, stage, vertical = false }: Props) {
  const { active, paged, timed, dwell } = stage;
  const filling = vertical
    ? "animate-[fill-y_linear_forwards]"
    : "animate-[fill-x_linear_forwards]";
  const shown = !paged
    ? ""
    : index < active || (index === active && !timed)
      ? "[--fill:1]"
      : index === active
        ? filling
        : "";

  return (
    <span
      data-fill={index}
      style={{ animationDuration: `${dwell}ms` }}
      className={`block size-full rounded-full bg-white ${
        vertical ? "fill-y origin-top" : "fill-x origin-left"
      } ${shown}`}
    />
  );
}
