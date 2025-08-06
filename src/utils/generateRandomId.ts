export function generateRandomId(prefix?: string): string {
  return `${prefix || "VAZ"}${Date.now()}${Math.floor(
    Math.random() * 100
  )}`;
}