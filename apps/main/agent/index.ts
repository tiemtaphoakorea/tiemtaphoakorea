import { Agent } from "@openai/agents";
import { MAX_TOKENS, MODEL, TEMPERATURE } from "./constants";
import { PRODUCT_TOOL_RULES, SYSTEM_PROMPT } from "./prompts";
import { AI_AGENT_TOOLS } from "./tools";

export const agent = new Agent({
  name: "K-SMART Support Agent",
  instructions: `${SYSTEM_PROMPT}\n\n${PRODUCT_TOOL_RULES}`,
  model: MODEL,
  modelSettings: {
    temperature: TEMPERATURE,
    maxTokens: MAX_TOKENS,
  },
  tools: AI_AGENT_TOOLS,
});
