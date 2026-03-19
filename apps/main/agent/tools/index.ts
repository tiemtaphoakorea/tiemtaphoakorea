import { notifyHumanSupportTool } from "./notify-human-support";
import { getProductAdviceDataTool } from "./product-advice-data";
import { searchProductsTool } from "./search-products";

export const AI_AGENT_TOOLS = [
  searchProductsTool,
  getProductAdviceDataTool,
  notifyHumanSupportTool,
];
