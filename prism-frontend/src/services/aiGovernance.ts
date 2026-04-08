import { aiEndpoint, getAiBaseUrl, isAiProxyConfigured } from "../config/ai";

export type GovernanceProposalPayload = {
  proposalId: string;
  proposer: string;
  callData: string;
  approvalCount: string;
  executed: boolean;
  requiredApprovals?: string;
  contractAddress: string;
};

export type GovernanceSummaryResponse = {
  summary: string;
  risk?: "low" | "medium" | "high";
  notes?: string;
};

export function isGovernanceAiConfigured(): boolean {
  return isAiProxyConfigured();
}

export async function fetchGovernanceSummary(
  payload: GovernanceProposalPayload
): Promise<GovernanceSummaryResponse> {
  if (getAiBaseUrl() === undefined) {
    throw new Error(
      "Set VITE_AI_BASE_URL or VITE_AI_GOVERNANCE_URL in .env (e.g. http://localhost:8787)"
    );
  }
  const url = aiEndpoint("/governance-summary");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 240) || `Request failed (${res.status})`);
  }
  const data = (await res.json()) as GovernanceSummaryResponse;
  if (!data.summary || typeof data.summary !== "string") {
    throw new Error("Invalid response from AI service");
  }
  return data;
}
