interface Env {
  ANTHROPIC_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_API_BASE?: string;
  E2B_API_KEY?: string;
  SANDBOX_AGENT_URL?: string; // Sandbox Agent server URL (sandboxagent.dev)
  SESSION_ID?: string; // Optional session ID for Sandbox Agent
  OPENCODE_AGENT_URL?: string; // OpenCode agent running in Daytona
  DAYTONA_API_KEY?: string; // For creating/managing sandboxes
  DAYTONA_API_URL?: string; // Daytona API endpoint
}
