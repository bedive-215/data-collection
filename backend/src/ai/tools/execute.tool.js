import { TOOL_MAP } from "../core/tools/tool.map.js";

export async function executeTool(name, args = {}, user, context = {}) {
  const handler = TOOL_MAP[name];

  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const safeArgs = args && typeof args === "object" ? args : {};

  const start = Date.now();

  try {
    const result = await handler({
      args: safeArgs,
      user,
      context,
    });

    const duration = Date.now() - start;

    console.log(`[TOOL] ${name} executed in ${duration}ms`);

    return {
      ...result,
      _meta: {
        tool: name,
        duration,
      },
    };
  } catch (err) {
    console.error(`[TOOL ERROR] ${name}`, err);

    return {
      _reply: `Tool ${name} failed: ${err.message}`,
      _error: true,
      _meta: {
        tool: name,
        failed: true,
      },
    };
  }
}