export interface ToolHandler {
  description: string;
  handler: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  inputSchema?: Record<string, unknown>;
}

export interface McpModule {
  name: string;
  tools: Record<string, ToolHandler>;
}
