import { notifyHumanSupportTool } from "@/agent/tools/notify-human-support";
import { getProductAdviceDataTool } from "@/agent/tools/product-advice-data";
import { searchProductsTool } from "@/agent/tools/search-products";

export const AI_AGENT_TOOLS = [
  searchProductsTool,
  getProductAdviceDataTool,
  notifyHumanSupportTool,
];
