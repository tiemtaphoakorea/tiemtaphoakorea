const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  return value.trim().toLowerCase() === "true";
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseTemperature = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseFloat(value || "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
};

export const AGENT_ENABLED = parseBoolean(process.env.AI_AGENT_ENABLED, true);
export const MODEL = process.env.AI_AGENT_MODEL || "gpt-4o-mini";
export const MAX_CONTEXT_MESSAGES = parsePositiveInt(process.env.AI_AGENT_MAX_CONTEXT_MESSAGES, 12);
export const TEMPERATURE = parseTemperature(process.env.AI_AGENT_TEMPERATURE, 0.4);
export const MAX_TOKENS = parsePositiveInt(process.env.AI_AGENT_MAX_TOKENS, 220);
export const TIMEOUT_MS = parsePositiveInt(process.env.AI_AGENT_TIMEOUT_MS, 15000);
export const MAX_TURNS = parsePositiveInt(process.env.AI_AGENT_MAX_TURNS, 4);
export const AGENT_USERNAME = process.env.AI_AGENT_USERNAME || "ai_agent_bot";
export const AGENT_DISPLAY_NAME = process.env.AI_AGENT_DISPLAY_NAME || "AI Agent";
