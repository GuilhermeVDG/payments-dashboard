/** Title and shared description for controls the reference shows but this demo does not implement. */
export const UNAVAILABLE_ACTION_TITLE = 'Not available in this demo';

/** Id of the shared description, referenced with aria-describedby by every inert control. */
export const UNAVAILABLE_HINT_ID = 'unavailable-action-hint';

/** Props that mark a focusable control as inert and explain why. */
export const unavailableProps = {
  'aria-disabled': true,
  'aria-describedby': UNAVAILABLE_HINT_ID,
  title: UNAVAILABLE_ACTION_TITLE,
} as const;

/** Rendered once by the app shell; hidden text is still read as a description. */
export function UnavailableHint() {
  return (
    <span id={UNAVAILABLE_HINT_ID} hidden>
      {UNAVAILABLE_ACTION_TITLE}
    </span>
  );
}
