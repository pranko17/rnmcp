import { type HostToolHandler } from '@/server/host/types';
import { getEventCapture } from '@/server/metro/eventCapture';
import { resolveMetroUrl } from '@/server/metro/resolveMetroUrl';
import { parseSliceArg, sliceSchemaDescription } from '@/shared/slice';

export const getEventsTool = (): HostToolHandler => {
  return {
    description: `Read recent Metro reporter events from a server-side ring buffer fed by Metro's WebSocket \`/events\` stream.

Metro emits events for the whole bundler lifecycle — \`bundle_build_started\` / \`bundle_build_done\` / \`bundle_build_failed\`, \`bundling_error\`, \`hmr_update\`, \`hmr_client_error\`, \`initial_update_done\`, \`transform_cache_reset\`, \`dep_graph_loading\` / \`dep_graph_loaded\`, \`client_log\`, \`worker_stdout_chunk\` / \`worker_stderr_chunk\`. When an agent edits a file and HMR silently fails (syntax error, broken import), the red box may not appear — but the \`bundling_error\` / \`hmr_client_error\` event already explains why.

The capture is lazy (connects on first call) and auto-reconnects. Buffer holds the last 200 events. Pass \`since: <msEpoch>\` to get only what arrived after a known checkpoint ("events since right before I edited Foo.tsx"). \`type\` filters to one or several event types.

Each event has \`{ id, receivedAt, type, data }\`; \`data\` is the raw Metro payload minus the \`type\` field.`,
    handler: async (args, ctx) => {
      const metroUrl = resolveMetroUrl(args, ctx);
      const capture = getEventCapture(metroUrl);

      const type = args.type as string | string[] | undefined;
      const since = typeof args.since === 'number' ? args.since : undefined;
      const slice = parseSliceArg(args.slice) ?? [-50];

      const result = capture.getEvents({ since, slice, type });
      return { metroUrl, ...result };
    },
    inputSchema: {
      clientId: {
        description:
          'Target client ID — used to pick up the Metro URL the app was loaded from (falls back to `metroUrl` or the hardcoded default).',
        type: 'string',
      },
      metroUrl: {
        description: `Base URL of the Metro dev server. Overrides the URL reported by the connected client. Default "http://localhost:8081".`,
        type: 'string',
      },
      since: {
        description: 'Only return events with `receivedAt >= since` (ms since epoch).',
        type: 'number',
      },
      slice: {
        description: sliceSchemaDescription('Default [-50] = the newest 50.'),
        examples: [[-10], [-20, -10], [0]],
        type: 'array',
      },
      type: {
        description:
          'Filter by event type. Accepts a single string or an array of types (OR semantics).',
        examples: ['bundling_error', ['bundling_error', 'hmr_client_error', 'bundle_build_failed']],
      },
    },
  };
};
