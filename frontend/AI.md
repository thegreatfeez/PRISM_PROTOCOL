# Prism frontend — AI features

This app uses a **small Node proxy** (`server/`) that calls **Gemini**. The browser never holds your API key.

There are **two AI features**:

| Feature | Where in the UI | HTTP endpoint (on the proxy) | Purpose |
|--------|-------------------|------------------------------|---------|
| **Protocol guide** | Floating **“Protocol guide”** button (bottom-right, every page) | `POST /protocol-assistant` | Answer questions about how Prism works and how to use the app. |
| **Governance proposal summary** | **Governance** → expand a **proposal** → **AI proposal summary** | `POST /governance-summary` | Summarize a specific multisig proposal from calldata and metadata. |

Both use the **same base URL** for the proxy.

---

## 1. One-time setup

### A. Install proxy dependencies

From the `prism-frontend` folder:

```bash
cd server
npm install
```

### B. API key (server only)

Set env in `prism-frontend/.env` (recommended), root `.env`, or export variables in your shell:

```env
GEMINI_API_KEY=your_key_here
```

Optional:

```env
GEMINI_MODEL=gemini-2.5-flash
PORT=8787
```

This proxy currently reads `.env` from `prism-frontend/.env` first, then falls back to root `.env`.

### C. Frontend env (`prism-frontend/.env`)

Point the app at the proxy **origin** (no path):

```env
VITE_AI_BASE_URL=http://localhost:8787
```

If you already use the older name, this still works:

```env
VITE_AI_GOVERNANCE_URL=http://localhost:8787
```

`VITE_AI_BASE_URL` wins when both are set.

After any change to `VITE_*` vars, **restart** `npm run dev`.

### Development: Vite proxy (fixes “Cannot POST /protocol-assistant”)

If the browser POSTs to the **wrong host** (e.g. the Vite dev server on port **5173** instead of the Node AI server on **8787**), you get an HTML error: `Cannot POST /protocol-assistant`.

This project proxies these paths in **`vite.config.ts`**:

- `POST /protocol-assistant` → `http://localhost:8787`
- `POST /governance-summary` → `http://localhost:8787`

In **development**, if you **omit** `VITE_AI_BASE_URL` / `VITE_AI_GOVERNANCE_URL`, the app uses **same-origin** URLs (`/protocol-assistant`, …) so Vite forwards them to port **8787**. You must still run `cd server && npm start`.

If you **set** `VITE_AI_BASE_URL`, it must be the **AI server** URL, e.g. `http://localhost:8787` — **not** `http://localhost:5173` (Vite).

---

## 2. How to run when testing

You need **two processes**:

1. **AI proxy** (Gemini calls):

   ```bash
   cd server
   npm start
   ```

   You should see: `Prism AI proxy: http://localhost:8787 ...`

2. **Vite app**:

   ```bash
   npm run dev
   ```

Order does not matter as long as both are up before you click AI actions.

---

## 3. How to test each feature

### Protocol guide (always try this first)

1. Open any page (e.g. Dashboard).
2. Click **Protocol guide** (bottom-right).
3. If you see the amber box about env, fix `VITE_AI_BASE_URL` and restart Vite.
4. Type a question (e.g. “What is staking?”) and **Send**.
5. You should get a reply; if not, check the terminal running `server/` for errors.

### Governance proposal summary

1. You need a **real proposal** on-chain (non-empty proposer for that slot).
2. Go to **Governance**, expand the proposal row.
3. Under **Calldata**, use **Generate AI analysis**.
4. Same proxy and same `GEMINI_API_KEY` as above.

---

## 4. Production / deployment

- Deploy the `server` app to any Node host (HTTPS).
- Set `GEMINI_API_KEY` (and optional `GEMINI_MODEL`, `PORT`) in that host’s environment.
- Set the frontend to:

  `VITE_AI_BASE_URL=https://your-proxy.example.com`

- Ensure CORS allows your frontend origin (the template uses `cors({ origin: true })` for development; tighten for production if needed).

---

## 5. Troubleshooting

| Symptom | What to check |
|--------|----------------|
| Protocol button opens but “Configure …” / errors on send | `VITE_AI_BASE_URL` missing or wrong; Vite not restarted; proxy not running. |
| `Failed to fetch` / network error | Proxy URL, firewall, or wrong port (default **8787**). |
| `GEMINI_API_KEY is not set` | Ensure key exists in `prism-frontend/.env` (or root `.env`) and restart `npm start`. |
| Gemini `404 ... model is not found` | Set `GEMINI_MODEL=gemini-2.5-flash` (or omit). Proxy also retries with fallback models. |
| Gemini `503 high demand` | Temporary provider overload. Proxy now retries automatically with backoff; retry in a few seconds. |
| Governance AI never appears | Expand a proposal that **exists**; empty slots are hidden. |
| CORS errors in browser console | Proxy must allow your site’s origin in production. |

---

## 6. Files reference (for developers)

| Area | Files |
|------|--------|
| Base URL helper | `src/config/ai.ts` |
| Protocol chat client | `src/services/aiAssistant.ts` |
| Governance summary client | `src/services/aiGovernance.ts` |
| Protocol guide UI | `src/components/ai/ProtocolAssistant.tsx` |
| Layout (global button) | `src/components/layout/Layout.tsx` |
| Governance UI | `src/pages/GovernancePage.tsx` |
| Proxy server | `server/index.mjs`, `server/package.json` |

---

## 7. Safety note

AI text is **informational only**. It does not sign transactions. Always verify amounts, addresses, and calldata in the wallet and on the explorer before signing.
