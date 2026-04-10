import { useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { isAiProxyConfigured } from "../../config/ai";
import { fetchProtocolAssistant, type ChatMessage } from "../../services/aiAssistant";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi — I can explain Prism Protocol at a high level: NFT gaming assets, staking, borrowing, marketplace, multisig governance, and treasury. What would you like to know?",
};

export function ProtocolAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isAiProxyConfigured();

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!configured) {
      setError("Configure VITE_AI_BASE_URL (or VITE_AI_GOVERNANCE_URL) and run the server in server/.");
      return;
    }
    setError(null);
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await fetchProtocolAssistant(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg.slice(0, 200));
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-violet-600 text-white
          px-4 py-2.5 text-sm font-semibold shadow-lg shadow-violet-300/50 hover:bg-violet-700
          transition-colors lg:bottom-6 lg:right-6"
        title="Ask about Prism Protocol"
      >
        <MessageCircle size={18} />
        Protocol guide
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Prism Protocol guide"
        subtitle="Ask how the app and on-chain protocol work"
        size="xl"
      >
        <div className="space-y-3">
          {!configured && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              AI proxy URL is not set. Add{" "}
              <span className="font-mono">VITE_AI_BASE_URL=http://localhost:8787</span> to{" "}
              <span className="font-mono">.env</span>, run the server in{" "}
              <span className="font-mono">server/</span>, restart{" "}
              <span className="font-mono">npm run dev</span>. See{" "}
              <span className="font-mono">AI.md</span>.
            </p>
          )}

          <div className="max-h-[min(420px,55vh)] overflow-y-auto space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-6 bg-violet-100 text-violet-900"
                    : "mr-6 bg-white border border-slate-100 text-slate-700"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <div className="flex gap-2">
            <input
              className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm px-3
                focus:outline-none focus:ring-2 focus:ring-violet-400"
              placeholder="Ask a question…"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            />
            <Button
              variant="primary"
              size="md"
              loading={loading}
              disabled={loading || !input.trim()}
              onClick={send}
              icon={<Send size={15} />}
            >
              Send
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
