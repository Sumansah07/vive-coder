import { env } from 'node:process';

export function getAPIKey(cloudflareEnv: Env) {
  /**
   * The `cloudflareEnv` is only used when deployed or when previewing locally.
   * In development the environment variables are available through `env`.
   */
  return env.OPENROUTER_API_KEY || cloudflareEnv.OPENROUTER_API_KEY || env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY;
}

export function getBaseURL(cloudflareEnv: Env) {
  return env.OPENROUTER_API_BASE || cloudflareEnv.OPENROUTER_API_BASE;
}
