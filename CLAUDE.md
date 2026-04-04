# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Compile TypeScript (output to dist/)
yarn dev            # Watch mode compilation
yarn lint           # ESLint check (src/**/*.{ts,tsx})
yarn lint:fix       # Auto-fix ESLint violations
yarn lint:ts        # TypeScript type check (tsc --noEmit)
```

No test suite is configured.

## Architecture

`react-native-mcp` is a bidirectional MCP bridge connecting React Native apps to AI agents. The server is a proxy — all business logic (state collection, command execution) runs inside the RN app.

```
AI Agent  --stdio/MCP-->  MCP Server (Node.js)  --WebSocket-->  RN App (device)
```

### Package Structure

The package has three entry points:

- **Root** (`src/index.ts`) — re-exports client + modules (RN-safe, no server code)
- **Server** (`src/server/`) — Node.js MCP server + WebSocket bridge (not bundled into RN)
- **Modules** (`src/modules/`) — built-in RN modules (navigation, etc.)

```
src/
  client/
    contexts/McpContext/    — McpContext, McpProvider, context types
    hooks/                  — useMcpState, useMcpTool (noop in prod)
    models/                 — McpModule, ToolHandler interfaces
    utils/                  — McpConnection (WS client), ModuleRunner
  server/
    bridge.ts               — WebSocket server, request/response dispatch
    mcpServer.ts            — McpServer wrapper, built-in tools (state_get, state_list, connection_status)
    cli.ts                  — CLI entry point (npx react-native-mcp)
  modules/
    navigation/             — Navigation module (get_state, navigate, go_back)
  shared/
    protocol.ts             — WebSocket message types (RegistrationMessage, ToolRequest, etc.)
```

### File & Folder Conventions

- **Contexts**: `contexts/ContextName/` folder with `ContextName.ts`, types, provider, and `index.ts` barrel export.
- **Hooks**: camelCase files in `hooks/` (e.g. `useMcpState.ts`).
- **Models**: types in `models/types.ts`.
- **Modules**: each module gets its own folder in `modules/` (e.g. `modules/navigation/`) with `navigation.ts`, `types.ts`, and `index.ts`. This allows splitting complex modules across multiple files.

### Data Flow

1. RN app mounts `McpProvider` with modules → opens WebSocket to bridge (port 8347)
2. On connect, sends `RegistrationMessage` with module descriptors (tool names, schemas)
3. MCP server registers tools dynamically based on registration
4. AI agent calls a tool → server sends `ToolRequest` over WS → RN app executes handler → returns `ToolResponse`
5. `useMcpState` sends `state_update` messages → server stores in memory → AI reads via `state_get` tool (no WS roundtrip)
6. `useMcpTool` sends `tool_register`/`tool_unregister` → server adds/removes tools dynamically

### Dev vs Production

- `useMcpState` and `useMcpTool` check `typeof __DEV__ !== 'undefined' && __DEV__` — in production they are replaced with `() => {}` (noop)
- `McpProvider` is wrapped in `if (__DEV__)` by the consuming app — WS connection never created in prod
- Metro tree-shakes the dev branch entirely from production bundles

### Module Interface

Modules are plain objects registered via McpProvider. Each tool has a handler that runs in the RN runtime:

```typescript
interface McpModule {
  name: string;
  tools: Record<string, ToolHandler>;
}

interface ToolHandler {
  description: string;
  handler: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  inputSchema?: Record<string, unknown>;
}
```

## Code Style

- **Path aliases**: `@/*` maps to `./src/*`. Relative `../` imports are lint-restricted — use `@/` for cross-directory, `./` for same-directory.
- **Type imports**: Always inline — `import { type Foo }` not `import type { Foo }`. Same for re-exports.
- **Import order**: Enforced by `eslint-plugin-import` — builtin → external → internal → parent → sibling, with blank lines between groups, alphabetized.
- **Object/interface keys**: Sorted alphabetically (enforced by `sort-keys-fix` and `typescript-sort-keys`).
- **Formatting**: Prettier with 100-char printWidth, single quotes, 2-space indent, es5 trailing commas.

## Key Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol implementation (server-side only). Imports require `.js` extension: `@modelcontextprotocol/sdk/server/mcp.js`.
- `ws` — WebSocket server (server-side only, RN uses built-in WebSocket).
- `zod` — Schema validation for MCP tool input schemas.
- `react` — Peer dependency (>=19), optional (server can run without it).
