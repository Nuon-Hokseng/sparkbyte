type Props = {
  /** Which slide this is the line of. */
  index: number;
  /** The line runs downwards, not across. */
  vertical?: boolean;
};

/**
 * The white that fills a step's line in a carousel's progress row. It follows
 * the scroll: the stage (see `useScrollStage`) writes --fill on it, marked as
 * it is with `data-fill`, as much as the page has scrolled through its slide.
 */
export function StepFill({ index, vertical = false }: Props) {
  return (
    <span
      data-fill={index}
      className={`block size-full rounded-full bg-white ${
        vertical ? "fill-y origin-top" : "fill-x origin-left"
      }`}
    />
  );
}
