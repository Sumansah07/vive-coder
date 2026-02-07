/**
 * E2B + Claude Code Agent
 * 
 * Proper architecture:
 * - LLM streaming for real-time UX
 * - E2B sandbox for safe code execution
 * - Parallel execution (thinking + doing)
 * 
 * Uses OpenRouter for Claude access (more flexible)
 */

import { Sandbox } from '@e2b/code-interpreter';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

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

  constructor(openrouterApiKey: string, e2bApiKey: string) {
    this.openrouter = createOpenAI({
      apiKey: openrouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    this.e2bApiKey = e2bApiKey;
  }

  /**
   * Initialize E2B sandbox
   */
  async initSandbox(): Promise<void> {
    if (!this.sandbox) {
      this.sandbox = await Sandbox.create({
        apiKey: this.e2bApiKey,
        metadata: { purpose: 'bolt-ai-agent' },
      });
      console.log('[E2B] Sandbox created:', this.sandbox.sandboxId);
    }
  }

  /**
   * Stream response with parallel execution
   */
  async *streamResponse(messages: AgentMessage[]): AsyncGenerator<AgentEvent> {
    try {
      // Ensure sandbox is ready
      await this.initSandbox();

      // Start streaming via OpenRouter (using Qwen - free model)
      const result = await streamText({
        model: this.openrouter('z-ai/glm-4.5-air:free'),  // Free Qwen model
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: `You are an expert coding assistant with access to a secure sandbox environment.
        
When you need to create files or run code, describe what you're doing clearly.
You have access to a Node.js environment where you can execute JavaScript code.

Always explain your reasoning and the code you're creating.`,
      });

      // Stream tokens
      for await (const chunk of result.textStream) {
        yield {
          type: 'token',
          data: { text: chunk },
        };
      }

      yield { type: 'done' };

    } catch (error) {
      console.error('[E2B Agent] Error:', error);
      yield {
        type: 'error',
        data: { message: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Execute code in sandbox
   */
  async executeCode(code: string): Promise<any> {
    if (!this.sandbox) {
      await this.initSandbox();
    }

    try {
      const result = await this.sandbox!.runCode(code);
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
  }

  /**
   * Write file in sandbox
   */
  async writeFile(path: string, content: string): Promise<any> {
    if (!this.sandbox) {
      await this.initSandbox();
    }

    try {
      await this.sandbox!.files.write(path, content);
      return { success: true, path };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Write failed',
      };
    }
  }

  /**
   * Cleanup sandbox
   */
  async cleanup(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.kill();
      this.sandbox = null;
      console.log('[E2B] Sandbox cleaned up');
    }
  }
}
