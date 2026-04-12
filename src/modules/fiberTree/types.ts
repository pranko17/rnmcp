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

export interface ComponentQuery {
  hasProps?: string[];
  mcpId?: string;
  name?: string;
  testID?: string;
  text?: string;
}
