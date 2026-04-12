import { enrichDevicesWithClientStatus } from '@/server/host/deviceResolver';
import { type ProcessRunner } from '@/server/host/processRunner';
import { type HostToolHandler } from '@/server/host/types';

import { SCREENSHOT_TIMEOUT_MS } from './capture';

export const listDevicesTool = (runner: ProcessRunner): HostToolHandler => {
  return {
    description:
      'List all iOS simulators (booted or not) and Android devices (online or offline) visible via xcrun simctl / adb. Each device is annotated with connected=true and a clientId when it matches a currently-connected React Native client. Connected devices appear first in each platform group.',
    handler: async (_args, ctx) => {
      return enrichDevicesWithClientStatus(ctx.bridge, runner);
    },
    inputSchema: {},
    timeout: SCREENSHOT_TIMEOUT_MS,
  };
};
