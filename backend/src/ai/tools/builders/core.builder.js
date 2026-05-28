export function divider() {
  return "━━━━━━━━━━━━━━━━━━";
}

export function buildList(title, items = []) {
  return [title, ...items].filter(Boolean).join("\n");
}

export function section(title, content) {
  return `${title}\n${content}`;
}

export function statLine(label, value, icon = "•") {
  return `${label}: **${value ?? 0}**`;
}

export function emptyState(message) {
  return `📭 ${message}`;
}

export function hint(message) {
  return `💡 ${message}`;
}