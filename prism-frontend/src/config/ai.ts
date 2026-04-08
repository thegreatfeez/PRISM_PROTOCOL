export function getAiBaseUrl(): string | undefined {
  const explicit =
    import.meta.env.VITE_AI_BASE_URL?.trim() ||
    import.meta.env.VITE_AI_GOVERNANCE_URL?.trim();
  if (explicit) return explicit;
  if (import.meta.env.DEV) return "";
  return undefined;
}

export function isAiProxyConfigured(): boolean {
  return getAiBaseUrl() !== undefined;
}

export function aiEndpoint(path: "/protocol-assistant" | "/governance-summary"): string {
  const base = getAiBaseUrl();
  if (base === undefined) {
    throw new Error("AI proxy URL not configured");
  }
  if (base === "") return path;
  return `${base.replace(/\/$/, "")}${path}`;
}
