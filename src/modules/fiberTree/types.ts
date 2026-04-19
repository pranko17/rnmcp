export type ComponentType = 'composite' | 'host' | 'other' | 'text';

export interface Bounds {
  // physical pixels, top-left origin
  centerX: number;
  centerY: number;
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface SerializedComponent {
  children: SerializedComponent[];
  name: string;
  props: Record<string, unknown>;
  type: ComponentType;
  bounds?: Bounds;
  mcpId?: string;
  testID?: string;
  text?: string;
}

/**
 * Per-prop match specification used in `ComponentQuery.props`.
 * - primitive → strict equality (good for typed props like `disabled: false`)
 * - `{ contains: str, deep?: boolean }` → substring match against String(value).
 *   With `deep: true` the value is JSON-serialized first (circular-safe,
 *   functions/symbols replaced, length capped), so nested values become
 *   searchable — e.g. `{ contains: "\"title\":\"Hello\"", deep: true }` hits
 *   a prop like `{ item: { title: "Hello" } }`. Without `deep`, non-primitive
 *   values don't match.
 * - `{ regex: pattern, deep?: boolean }` → full regex test against the same
 *   string form. Invalid patterns don't throw, they just never match.
 */
export type PropMatcher =
  | boolean
  | number
  | string
  | { contains: string; deep?: boolean }
  | { regex: string; deep?: boolean };

export interface ComponentQuery {
  hasProps?: string[];
  mcpId?: string;
  name?: string;
  /**
   * Match by prop values. Each entry is AND-ed.
   * Example: { placeholder: { contains: "Search" }, variant: "primary" }.
   */
  props?: Record<string, PropMatcher>;
  testID?: string;
  text?: string;
}
