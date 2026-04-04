export type ComponentType = 'composite' | 'host' | 'other' | 'text';

export interface SerializedComponent {
  children: SerializedComponent[];
  name: string;
  props: Record<string, unknown>;
  type: ComponentType;
  testID?: string;
  text?: string;
}

export interface ComponentQuery {
  hasProps?: string[];
  name?: string;
  testID?: string;
  text?: string;
}
