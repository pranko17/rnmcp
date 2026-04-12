import { type ProcessRunner } from './processRunner';
import { screenshotTool } from './tools/capture';
import { listDevicesTool } from './tools/devices';
import { pressKeyTool, swipeTool, tapTool, typeTextTool } from './tools/input';
import { launchAppTool, restartAppTool, terminateAppTool } from './tools/lifecycle';
import { type HostModule } from './types';

export const hostModule = (runner: ProcessRunner): HostModule => {
  return {
    description:
      'OS-level operations that run on the MCP server host via xcrun simctl / adb. Works when the React Native app is hung, disconnected, or not installed.',
    name: 'host',
    tools: {
      launch_app: launchAppTool(runner),
      list_devices: listDevicesTool(runner),
      press_key: pressKeyTool(runner),
      restart_app: restartAppTool(runner),
      screenshot: screenshotTool(runner),
      swipe: swipeTool(runner),
      tap: tapTool(runner),
      terminate_app: terminateAppTool(runner),
      type_text: typeTextTool(runner),
    },
  };
};
