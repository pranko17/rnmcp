import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { type ModuleDescriptor } from '@/shared/protocol';

import { type Bridge } from './bridge';

export class McpServerWrapper {
  private mcp: McpServer;
  private modules: ModuleDescriptor[] = [];
  private stateStore = new Map<string, unknown>();

  constructor(private readonly bridge: Bridge) {
    this.mcp = new McpServer({ name: 'react-native-mcp', version: '0.1.0' });

    this.registerTools();
  }

  setModules(modules: ModuleDescriptor[]): void {
    this.modules = modules;
  }

  setState(key: string, value: unknown): void {
    this.stateStore.set(key, value);
  }

  removeState(key: string): void {
    this.stateStore.delete(key);
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
  }

  private registerTools(): void {
    this.mcp.tool(
      'call',
      'Call a tool registered by the React Native app. Use list_tools first to see available tools.',
      {
        args: z
          .string()
          .optional()
          .describe('Arguments as JSON string (e.g. {"screen": "AUTH_LOGIN_SCREEN"})'),
        tool: z
          .string()
          .describe('Tool name in format "module_method" (e.g. "navigation_navigate")'),
      },
      async ({ args, tool }) => {
        if (!this.bridge.isClientConnected()) {
          return {
            content: [
              {
                text: JSON.stringify({ error: 'React Native app is not connected' }),
                type: 'text' as const,
              },
            ],
          };
        }

        const parts = tool.split('_');
        if (parts.length < 2) {
          return {
            content: [
              {
                text: JSON.stringify({
                  error: `Invalid tool name "${tool}". Use "module_method" format.`,
                }),
                type: 'text' as const,
              },
            ],
          };
        }

        // Find the module and method
        const moduleName = parts[0]!;
        const methodName = parts.slice(1).join('_');

        const mod = this.modules.find((m) => {
          return m.name === moduleName;
        });
        if (!mod) {
          return {
            content: [
              {
                text: JSON.stringify({
                  error: `Module "${moduleName}" not found. Available: ${this.modules
                    .map((m) => {
                      return m.name;
                    })
                    .join(', ')}`,
                }),
                type: 'text' as const,
              },
            ],
          };
        }

        const toolDef = mod.tools.find((t) => {
          return t.name === methodName;
        });
        if (!toolDef) {
          return {
            content: [
              {
                text: JSON.stringify({
                  error: `Tool "${methodName}" not found in module "${moduleName}". Available: ${mod.tools
                    .map((t) => {
                      return t.name;
                    })
                    .join(', ')}`,
                }),
                type: 'text' as const,
              },
            ],
          };
        }

        let parsedArgs: Record<string, unknown> = {};
        if (args) {
          try {
            parsedArgs = JSON.parse(args) as Record<string, unknown>;
          } catch {
            return {
              content: [
                { text: JSON.stringify({ error: 'Invalid JSON in args' }), type: 'text' as const },
              ],
            };
          }
        }
        const result = await this.bridge.call(moduleName, methodName, parsedArgs, toolDef.timeout);
        return {
          content: [{ text: JSON.stringify(result, null, 2), type: 'text' as const }],
        };
      }
    );

    this.mcp.tool(
      'list_tools',
      'List all tools registered by the React Native app, grouped by module',
      async () => {
        if (!this.bridge.isClientConnected()) {
          return {
            content: [
              {
                text: JSON.stringify({
                  connected: false,
                  error: 'React Native app is not connected',
                }),
                type: 'text' as const,
              },
            ],
          };
        }

        const tools = this.modules.map((mod) => {
          return {
            module: mod.name,
            tools: mod.tools.map((t) => {
              return {
                description: t.description,
                inputSchema: t.inputSchema,
                name: `${mod.name}_${t.name}`,
              };
            }),
          };
        });

        return {
          content: [{ text: JSON.stringify(tools, null, 2), type: 'text' as const }],
        };
      }
    );

    this.mcp.tool('connection_status', 'Check if the React Native app is connected', async () => {
      return {
        content: [
          {
            text: JSON.stringify({
              connected: this.bridge.isClientConnected(),
              modules: this.modules.map((m) => {
                return m.name;
              }),
            }),
            type: 'text' as const,
          },
        ],
      };
    });

    this.mcp.tool(
      'state_get',
      'Read a state value exposed by the React Native app via useMcpState',
      { key: z.string().describe('State key to read (e.g. "cart", "auth")') },
      async ({ key }) => {
        const value = this.stateStore.get(key);
        if (value === undefined) {
          return {
            content: [
              {
                text: JSON.stringify({
                  error: `State "${key}" not found. Use state_list to see available keys.`,
                }),
                type: 'text' as const,
              },
            ],
          };
        }
        return {
          content: [{ text: JSON.stringify(value, null, 2), type: 'text' as const }],
        };
      }
    );

    this.mcp.tool(
      'state_list',
      'List all available state keys exposed by the React Native app',
      async () => {
        const keys = Array.from(this.stateStore.keys());
        return {
          content: [{ text: JSON.stringify({ keys }, null, 2), type: 'text' as const }],
        };
      }
    );
  }
}
