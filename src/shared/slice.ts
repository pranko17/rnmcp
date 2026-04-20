/**
 * Shared `slice` input shape for tools that expose a slice-style window into
 * a time-ordered buffer. Two-tuple mirrors `Array.prototype.slice(start, end?)`:
 * negative indices count from the end, so [-10] = last ten, [-20, -10] = the
 * ten before those, [0, 50] = the oldest fifty.
 */
export type SliceInput = [number] | [number, number];

/**
 * Coerce a tool-argument value to a well-formed SliceInput, or undefined when
 * the input is missing/malformed. Callers pick their own default behavior
 * (typically either "return all" or "last N").
 */
export const parseSliceArg = (raw: unknown): SliceInput | undefined => {
  if (!Array.isArray(raw) || raw.length === 0 || typeof raw[0] !== 'number') {
    return undefined;
  }
  const start = raw[0];
  const end = typeof raw[1] === 'number' ? raw[1] : undefined;
  return end === undefined ? [start] : [start, end];
};

export const applySlice = <T>(arr: T[], slice: SliceInput | undefined): T[] => {
  if (!slice) return arr;
  const [start, end] = slice;
  return end === undefined ? arr.slice(start) : arr.slice(start, end);
};

export const sliceSchemaDescription = (defaultHint: string): string => {
  return `[start, end?] window over the returned list (Array.prototype.slice semantics, negative indices count from the end). ${defaultHint} Examples: [-10] for the newest ten, [-20, -10] for the ten before those, [0, 50] for the oldest fifty.`;
};
