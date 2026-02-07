/**
 * E2B + Claude Code Agent
 * 
 * Features:
 * - LLM streaming for real-time UX
 * - E2B sandbox for safe code execution
 * - Persistent sandboxes per session (reused across messages)
 * - Full agentic capabilities (file ops, code execution, shell commands)
 * - Auto-cleanup after 5 minutes of inactivity
 */

import { Sandbox } from '@e2b/code-interpreter';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { sandboxManager } from './sandbox-manager';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentEvent {
  type: 'token' | 'tool_use' | 'tool_result' | 'error' | 'done';
  data?: any;
}

export class ClaudeCodeAgent {
  private openrouter: any;
  private sandbox: Sandbox | null = null;
  private e2bApiKey: string;
  private sessionId: string;

  constructor(openrouterApiKey: string, e2bApiKey: string, sessionId: string = 'default') {
    this.openrouter = createOpenAI({
      apiKey: openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.e2bApiKey = e2bApiKey;
    this.sessionId = sessionId;
  }

  /**
   * Initialize E2B sandbox (reuses existing if available)
   */
  async initSandbox(): Promise<void> {
    if (!this.sandbox) {
      this.sandbox = await sandboxManager.getOrCreateSandbox(this.sessionId, this.e2bApiKey);
    }
    sandboxManager.updateActivity(this.sessionId);
  }

  /**
   * Stream response with tool calling
   */
  async *streamResponse(messages: AgentMessage[]): AsyncGenerator<AgentEvent> {
    try {
      // Ensure sandbox is ready
      await this.initSandbox();

      // Start streaming with tools
      const result = await streamText({
        model: this.openrouter('anthropic/claude-3.5-haiku'),  // GLM 4.5 Air - working in your logs
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: `You are an expert coding assistant with access to a secure E2B sandbox environment.

You have the following capabilities:
- executeCode: Run JavaScript/Python code and see output
- writeFile: Create or update files
- readFile: Read file contents
- listFiles: List directory contents
- runCommand: Execute shell commands (npm install, mkdir, etc.)

When working on projects:
1. Create proper file structure
2. Write clean, well-documented code
3. Test your code by executing it
4. Fix any errors you encounter

Always explain what you're doing and use tools to actually create/modify files.`,
        tools: this.getTools(),
        maxToolRoundtrips: 5,
      });

      // Stream tokens and tool calls
      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          case 'text-delta':
            yield {
              type: 'token',
              data: { text: chunk.textDelta },
            };
            break;

          case 'tool-call':
            yield {
              type: 'tool_use',
              data: {
                name: chunk.toolName,
                args: chunk.args,
              },
            };
            break;

          case 'tool-result':
            yield {
              type: 'tool_result',
              data: {
                tool: chunk.toolName,
                result: chunk.result,
              },
            };
            break;

          case 'finish':
            yield { type: 'done' };
            break;

          case 'error':
            yield {
              type: 'error',
              data: { message: chunk.error },
            };
            break;
        }
      }

    } catch (error) {
      console.error('[E2B Agent] Error:', error);
      yield {
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Get available tools
   */
  private getTools() {
    return {
      executeCode: tool({
        description: 'Execute JavaScript or Python code in the sandbox and return the output',
        parameters: z.object({
          code: z.string().describe('The code to execute'),
          language: z.enum(['javascript', 'python']).default('javascript'),
        }),
        execute: async ({ code, language }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized');
          
          try {
            const result = await this.sandbox.runCode(code);
            return {
              success: true,
              stdout: result.logs.stdout.join('\n'),
              stderr: result.logs.stderr.join('\n'),
              error: result.error,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Execution failed',
            };
          }
        },
      }),

      writeFile: tool({
        description: 'Create or overwrite a file in the sandbox',
        parameters: z.object({
          path: z.string().describe('File path (e.g., src/App.jsx)'),
          content: z.string().describe('File content'),
        }),
        execute: async ({ path, content }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized');
          
          try {
            await this.sandbox.files.write(path, content);
            return { success: true, path, message: `File created: ${path}` };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Write failed',
            };
          }
        },
      }),

      readFile: tool({
        description: 'Read the contents of a file from the sandbox',
        parameters: z.object({
          path: z.string().describe('File path to read'),
        }),
        execute: async ({ path }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized');
          
          try {
            const content = await this.sandbox.files.read(path);
            return { success: true, content, path };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Read failed',
            };
          }
        },
      }),

      listFiles: tool({
        description: 'List files in a directory',
        parameters: z.object({
          path: z.string().default('/').describe('Directory path'),
        }),
        execute: async ({ path }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized');
          
          try {
            const files = await this.sandbox.files.list(path);
            return { success: true, files, path };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'List failed',
            };
          }
        },
      }),

      runCommand: tool({
        description: 'Run a shell command in the sandbox (e.g., npm install, mkdir)',
        parameters: z.object({
          command: z.string().describe('Shell command to execute'),
        }),
        execute: async ({ command }) => {
          if (!this.sandbox) throw new Error('Sandbox not initialized');
          
          try {
            const result = await this.sandbox.commands.run(command);
            return {
              success: true,
              stdout: result.stdout,
              stderr: result.stderr,
              exitCode: result.exitCode,
            };
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Command failed',
            };
          }
        },
      }),
    };
  }

  /**
   * Cleanup (sandbox persists, just update activity)
   */
  async cleanup(): Promise<void> {
    if (this.sessionId) {
      sandboxManager.updateActivity(this.sessionId);
    }
    // Don't kill sandbox - it will auto-cleanup after 5 min inactivity
    console.log('[E2B Agent] Session activity updated');
  }
}
