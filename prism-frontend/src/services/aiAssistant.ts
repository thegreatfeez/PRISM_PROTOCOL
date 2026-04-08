import { aiEndpoint, getAiBaseUrl } from "../config/ai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function fetchProtocolAssistant(
  messages: ChatMessage[]
): Promise<string> {
  if (getAiBaseUrl() === undefined) {
    throw new Error(
      "Set VITE_AI_BASE_URL or VITE_AI_GOVERNANCE_URL in .env (e.g. http://localhost:8787)"
    );
  }
  const url = aiEndpoint("/protocol-assistant");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 240) || `Request failed (${res.status})`);
  }
  const data = (await res.json()) as { reply?: string };
  if (!data.reply || typeof data.reply !== "string") {
    throw new Error("Invalid response from AI service");
  }
  return data.reply;
}
