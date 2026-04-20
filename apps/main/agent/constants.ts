import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const configPath = fileURLToPath(new URL("./agent.config.yaml", import.meta.url));
const config = parse(readFileSync(configPath, "utf8")) as {
  enabled: boolean;
  identity: { username: string; displayName: string };
  model: { name: string; temperature: number; maxTokens: number };
  limits: { maxContextMessages: number; maxTurns: number; timeoutMs: number };
  safeMode: boolean;
};

export const AGENT_ENABLED = config.enabled;
export const AGENT_USERNAME = config.identity.username;
export const AGENT_DISPLAY_NAME = config.identity.displayName;
export const MODEL = config.model.name;
export const TEMPERATURE = config.model.temperature;
export const MAX_TOKENS = config.model.maxTokens;
export const MAX_CONTEXT_MESSAGES = config.limits.maxContextMessages;
export const MAX_TURNS = config.limits.maxTurns;
export const TIMEOUT_MS = config.limits.timeoutMs;
export const SAFE_MODE = config.safeMode;
