import { FAST_PATTERNS } from "./patterns.js";

export function detectIntent(message) {
  const text = String(message).toLowerCase(); 

  let bestMatch = null;

  for (const p of FAST_PATTERNS) {
    if (!p.match(text)) continue;

    const args = p.extract ? p.extract(text) : {};

    if (!bestMatch || p.priority > bestMatch.priority) {
      bestMatch = {
        tool: p.tool,
        args
      };
    }
  }

  return bestMatch;
}