export interface AppTargetError {
  error: string;
}

export const NATIVE_ID_SCHEMA = {
  serial: {
    description:
      'Optional explicit adb serial of the target Android device (e.g. "emulator-5554"). Highest priority — bypasses clientId and platform-based device selection. Use values from host__list_devices output.',
    type: 'string',
  },
  udid: {
    description:
      'Optional explicit simctl UDID of the target iOS simulator. Highest priority — bypasses clientId and platform-based device selection. Use values from host__list_devices output.',
    type: 'string',
  },
} as const;

export const PLATFORM_ARG_SCHEMA = {
  description:
    'Optional platform filter: "ios" or "android". Ignored when clientId is provided on the outer call tool (the client\'s own platform is used instead).',
  enum: ['android', 'ios'],
  type: 'string',
} as const;

export const parsePlatformArg = (value: unknown): 'android' | 'ios' | undefined => {
  return value === 'ios' || value === 'android' ? value : undefined;
};

export const parseStringArg = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const parseResolveOptions = (
  args: Record<string, unknown>
): { platform?: 'android' | 'ios'; serial?: string; udid?: string } => {
  return {
    platform: parsePlatformArg(args.platform),
    serial: parseStringArg(args.serial),
    udid: parseStringArg(args.udid),
  };
};

export const parseCoord = (
  value: unknown,
  name: string
): { ok: true; value: number } | { error: string; ok: false } => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return { error: `'${name}' must be a non-negative finite number`, ok: false };
  }
  return { ok: true, value: Math.floor(value) };
};
