import { type HostToolHandler } from '@/server/host/types';

const DEFAULT_METRO = 'http://localhost:8081';
const METRO_TIMEOUT_MS = 5_000;

interface StackFrame {
  column?: number;
  file?: string;
  lineNumber?: number;
  methodName?: string;
}

interface ResolvedFrame extends StackFrame {
  collapse?: boolean;
}

/**
 * Parses a raw Error.stack string into structured frames. Supports both the
 * V8 `    at method (file:line:col)` format and the Hermes / JSC
 * `method@file:line:col` form used by React Native. Returns an empty array if
 * nothing matches so the caller can fall back gracefully.
 */
const parseStackString = (stack: string): StackFrame[] => {
  const frames: StackFrame[] = [];

  const v8Regex = /^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = v8Regex.exec(stack)) !== null) {
    frames.push({
      column: Number.parseInt(match[4]!, 10),
      file: match[2]!,
      lineNumber: Number.parseInt(match[3]!, 10),
      methodName: match[1]?.trim() || undefined,
    });
  }
  if (frames.length > 0) return frames;

  const hermesRegex = /^(.*?)@(.+?):(\d+):(\d+)$/gm;
  while ((match = hermesRegex.exec(stack)) !== null) {
    frames.push({
      column: Number.parseInt(match[4]!, 10),
      file: match[2]!,
      lineNumber: Number.parseInt(match[3]!, 10),
      methodName: match[1]?.trim() || undefined,
    });
  }
  return frames;
};

export const symbolicateTool = (): HostToolHandler => {
  return {
    description: `Resolve a JS stack trace via Metro's /symbolicate endpoint — maps bundled paths like "http://localhost:8081/index.bundle:12345:67" back to original sources like "src/components/Foo.tsx:42:10".

Pass either a raw stack string (from errors__get_errors.stack) or a parsed array of frames (from log_box__get_logs[*].stack). No-ops gracefully when Metro is unreachable (returns { skipped: true, error }), so safe to call opportunistically.`,
    handler: async (args) => {
      const stack = args.stack as string | undefined;
      const frames = args.frames as StackFrame[] | undefined;
      const metroUrl = ((args.metroUrl as string) || DEFAULT_METRO).replace(/\/$/, '');

      let rawFrames: StackFrame[];
      if (Array.isArray(frames) && frames.length > 0) {
        rawFrames = frames;
      } else if (typeof stack === 'string' && stack.length > 0) {
        rawFrames = parseStackString(stack);
      } else {
        return { error: 'Pass either `stack` (string) or `frames` (array).' };
      }

      if (rawFrames.length === 0) {
        return { error: 'No frames parsed from input.', frames: [], skipped: true };
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.abort();
        }, METRO_TIMEOUT_MS);
        const res = await fetch(`${metroUrl}/symbolicate`, {
          body: JSON.stringify({ stack: rawFrames }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) {
          return {
            error: `Metro responded ${res.status}`,
            frames: rawFrames,
            skipped: true,
          };
        }
        const json = (await res.json()) as { stack?: ResolvedFrame[] };
        return { frames: json.stack ?? rawFrames };
      } catch (err) {
        return {
          error: `Metro at ${metroUrl} unreachable: ${(err as Error).message}`,
          frames: rawFrames,
          skipped: true,
        };
      }
    },
    inputSchema: {
      frames: {
        description:
          'Parsed stack frames: [{ file, lineNumber, column, methodName? }]. Takes precedence over `stack` when both are provided.',
        examples: [
          [
            {
              column: 42,
              file: 'http://localhost:8081/index.bundle',
              lineNumber: 1234,
              methodName: 'render',
            },
          ],
        ],
        type: 'array',
      },
      metroUrl: {
        description: `Base URL of the Metro dev server. Default "${DEFAULT_METRO}".`,
        type: 'string',
      },
      stack: {
        description: 'Raw stack trace string (e.g. from an Error.stack). Parsed into frames.',
        type: 'string',
      },
    },
    timeout: METRO_TIMEOUT_MS + 1_000,
  };
};
