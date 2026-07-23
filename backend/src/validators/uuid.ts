const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns whether a string is a valid UUID v4 (or compatible variant).
 *
 * @param value Value to validate.
 * @returns True when the value matches UUID format.
 */
export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}
