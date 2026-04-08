import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config({ path: resolve(__dirname, "../../.env"), override: false });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "512kb" }));

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = (process.env.GEMINI_MODEL || "gemini-2.5-flash").replace(/^models\//, "");
  return { apiKey, model };
}

const MODEL_FALLBACKS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function safeJsonParse(maybeJson) {
  try {
    return JSON.parse(maybeJson);
  } catch {
    // Try to extract the first JSON object from a larger string
    const s = String(maybeJson ?? "");
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(s.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function geminiGenerate({ apiKey, model, system, userText, temperature = 0.4, maxOutputTokens = 1024 }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const body = {
    ...(system
      ? {
          systemInstruction: {
            parts: [{ text: system }],
          },
        }
      : {}),
    contents: [
      {
        role: "user",
        parts: [{ text: userText }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text();
    const msg = t?.slice(0, 600) || `Gemini request failed (${resp.status})`;
    const err = new Error(msg);
    err.status = resp.status;
    throw err;
  }

  const data = await resp.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text).filter(Boolean).join("")?.trim() ?? "";
  return text;
}

async function geminiGenerateWithFallback(params) {
  const preferred = String(params.model || "").replace(/^models\//, "");
  const modelQueue = [preferred, ...MODEL_FALLBACKS].filter(Boolean).filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError;
  for (const model of modelQueue) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await geminiGenerate({ ...params, model });
      } catch (e) {
        const msg = String(e?.message ?? "");
        const unsupported = e?.status === 404 || /not found|not supported|ListModels/i.test(msg);
        const overloaded =
          e?.status === 503 || e?.status === 429 || /high demand|unavailable|quota|rate limit/i.test(msg);

        if (unsupported) {
          lastError = e;
          break;
        }

        if (overloaded && attempt < 3) {
          await sleep(400 * 2 ** (attempt - 1));
          continue;
        }

        throw e;
      }
    }
  }

  throw lastError || new Error("No supported Gemini model found");
}

app.post("/governance-summary", async (req, res) => {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    return;
  }

  const b = req.body ?? {};
  const proposalId = String(b.proposalId ?? "");
  const proposer = String(b.proposer ?? "");
  const callData = String(b.callData ?? "0x");
  const approvalCount = String(b.approvalCount ?? "");
  const executed = Boolean(b.executed);
  const requiredApprovals = b.requiredApprovals != null ? String(b.requiredApprovals) : "";
  const contractAddress = String(b.contractAddress ?? "");

  const user = `You are a DeFi governance analyst for Prism Protocol: an EVM diamond proxy with multisig execution.

Respond with JSON only, no markdown. Shape:
{"summary":"2-5 sentences plain English","risk":"low"|"medium"|"high","notes":"optional short caveat"}

Proposal ID: ${proposalId}
Proposer: ${proposer}
Target contract (diamond): ${contractAddress}
Executed on-chain: ${executed}
Approvals so far: ${approvalCount}${requiredApprovals ? ` / required: ${requiredApprovals}` : ""}
Calldata (hex, ABI-encoded call): ${callData}

Explain what this call likely does (use the 4-byte selector as a hint). If calldata is empty or unknown, say what cannot be determined.`;

  let text = "";
  try {
    text = await geminiGenerateWithFallback({
      apiKey,
      model,
      userText: user,
      temperature: 0.25,
      maxOutputTokens: 512,
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
    return;
  }

  const parsed = safeJsonParse(text);
  if (!parsed) {
    res.json({ summary: text || "No summary produced.", risk: "medium", notes: "Model returned non-JSON; shown as raw text." });
    return;
  }

  const summary = typeof parsed.summary === "string" ? parsed.summary : String(parsed.summary ?? "");
  const risk = ["low", "medium", "high"].includes(parsed.risk) ? parsed.risk : "medium";
  const notes = parsed.notes != null ? String(parsed.notes) : undefined;

  res.json({ summary, risk, notes });
});

const SYSTEM_PROTOCOL_GUIDE = `You are the in-app guide for Prism Protocol, a DeFi / NFT protocol on EVM (HashKey Chain) using a Diamond proxy pattern.

Facts you may rely on (high level):
- Users connect an EVM wallet. PRM is the protocol ERC-20 token.
- NFTs are on-chain gaming-style assets (traits, metadata). Users can mint (where allowed), view collections, list on the marketplace, stake NFTs for fee share, and use borrow mechanics where implemented.
- Staking: NFTs can be staked with chosen durations; rewards relate to borrow fees per protocol design shown in the app (e.g. staker vs treasury split — tell users to verify numbers in the Staking page).
- Marketplace: list/buy NFTs with PRM; platform fee may apply.
- Borrow: NFT-backed borrow flows with collateral and deadlines as shown in the app.
- Governance: privileged actions go through a multisig on the Diamond; proposals carry calldata executed after enough approvals.
- Treasury: protocol treasury controls for authorized signers.

Rules:
- Be accurate; if you are unsure about a number, fee, or address, say the user should confirm on-chain or in the UI.
- Never tell users to share seed phrases or sign unclear transactions.
- Keep answers concise unless the user asks for detail. Use short paragraphs or bullet points.
- You only explain and guide; you do not execute transactions.`;

app.post("/protocol-assistant", async (req, res) => {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set" });
    return;
  }

  const raw = req.body?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    res.status(400).json({ error: "Expected body.messages as a non-empty array" });
    return;
  }

  const messages = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 12000) }));

  if (messages.length === 0) {
    res.status(400).json({ error: "No valid messages" });
    return;
  }

  const userText = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 48_000);

  let reply = "";
  try {
    reply = await geminiGenerateWithFallback({
      apiKey,
      model,
      system: SYSTEM_PROTOCOL_GUIDE,
      userText,
      temperature: 0.45,
      maxOutputTokens: 1024,
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) });
    return;
  }

  if (!reply) {
    res.status(500).json({ error: "Empty model response" });
    return;
  }

  res.json({ reply });
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`Prism AI proxy: http://localhost:${port} (governance-summary, protocol-assistant)`);
});
