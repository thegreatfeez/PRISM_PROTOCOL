import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { AppKitButton } from "@reown/appkit/react";
import { decodeFunctionData, encodeFunctionData, parseUnits, type Abi, type Hex } from "viem";
import {
  Shield, CheckCircle, Clock, XCircle, Play,
  ChevronDown, ChevronUp, UserPlus, UserMinus,
  RefreshCw, ArrowLeftRight, Sparkles, Coins,
  Vault, ShoppingBag, Landmark, Activity, Lock, ArrowLeft, Droplets, Code,
} from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/index";
import { Input } from "../components/ui/index";
import { Modal } from "../components/ui/Modal";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import {
  useMultisigOwners, useMultisigRequired, useProposal,
  useHasApproved, usePropose, useApproveProposal,
  useRevokeApproval, useExecuteProposal,
} from "../hooks/useMultisig";
import {
  DIAMOND_ADDRESS, MULTISIG_ABI, ERC721_ABI, ERC20_ABI,
  MARKETPLACE_ABI, STAKING_ABI, BORROW_ABI, TREASURY_ABI, OWNERSHIP_ABI, FAUCET_ABI,
  DIAMOND_CUT_ABI,
} from "../config/contracts";
import { shortenAddress, addressUrl, formatToken } from "../utils/formatters";
import { fetchGovernanceSummary, isGovernanceAiConfigured } from "../services/aiGovernance";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: MULTISIG_ABI } as const;

// ─── Init Multisig ─────────────────────────────────────────────────────────────
function useInitMultisig() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const init = (owners: `0x${string}`[], required: bigint) =>
    writeContract({ ...CONTRACT, functionName: "initMultisig", args: [owners, required] });
  return { init, isPending, isSuccess };
}

// ─── Proposal Action Registry ──────────────────────────────────────────────────
interface FieldDef {
  name: string;
  label: string;
  type: "address" | "uint256" | "uint256[]";
  placeholder: string;
  hint?: string;
  rangeInput?: boolean; // renders as From/To number pair instead of raw comma list
  /** User enters a decimal (e.g. 1 or 0.5); converted to on-chain uint256 with parseUnits. */
  humanDecimals?: number;
  humanSymbol?: "PRM" | "ETH";
}
interface ActionDef {
  key: string; label: string; description: string; category: string;
  abi: readonly any[]; functionName: string; fields: FieldDef[];
  /** When set, `mintERC20` recipient is always the diamond (faucet pool). */
  mintToDiamond?: boolean;
}

const PROPOSAL_ACTIONS: ActionDef[] = [
  // NFT
  { key: "mint", label: "Mint NFT", description: "Mint a single Prism NFT (no params)", category: "NFT", abi: ERC721_ABI, functionName: "mint", fields: [] },
  { key: "batchMint", label: "Batch Mint", description: "Mint multiple NFTs at once", category: "NFT", abi: ERC721_ABI, functionName: "batchMint", fields: [{ name: "_count", label: "Count", type: "uint256", placeholder: "10", hint: "How many NFTs to mint" }] },
  // Token
  { key: "mintERC20", label: "Mint Tokens", description: "Mint ERC20 tokens to an address", category: "Token", abi: ERC20_ABI, functionName: "mintERC20", fields: [{ name: "_to", label: "Recipient Address", type: "address", placeholder: "0x..." }, { name: "_amount", label: "Amount", type: "uint256", placeholder: "100", hint: "Token amount in PRM (decimals applied automatically)", humanDecimals: 18, humanSymbol: "PRM" }] },
  { key: "fundFaucet", label: "Fund Faucet", description: "Mint PRM into the diamond balance so users can claim from the Token Faucet page", category: "Token", abi: ERC20_ABI, functionName: "mintERC20", mintToDiamond: true, fields: [{ name: "_amount", label: "Amount", type: "uint256", placeholder: "1000", hint: "PRM to mint into the diamond (faucet pool)", humanDecimals: 18, humanSymbol: "PRM" }] },
  { key: "burnERC20", label: "Burn Tokens", description: "Burn ERC20 tokens", category: "Token", abi: ERC20_ABI, functionName: "burnERC20", fields: [{ name: "_amount", label: "Amount", type: "uint256", placeholder: "10", humanDecimals: 18, humanSymbol: "PRM" }] },
  // Governance
  { key: "addOwner", label: "Add Signer", description: "Add a new multisig signer", category: "Governance", abi: MULTISIG_ABI, functionName: "addOwner", fields: [{ name: "_owner", label: "New Signer Address", type: "address", placeholder: "0x..." }] },
  { key: "removeOwner", label: "Remove Signer", description: "Remove an existing signer", category: "Governance", abi: MULTISIG_ABI, functionName: "removeOwner", fields: [{ name: "_owner", label: "Signer to Remove", type: "address", placeholder: "0x..." }] },
  { key: "replaceOwner", label: "Replace Signer", description: "Swap one signer for another", category: "Governance", abi: MULTISIG_ABI, functionName: "replaceOwner", fields: [{ name: "_oldOwner", label: "Current Signer", type: "address", placeholder: "0x..." }, { name: "_newOwner", label: "New Signer", type: "address", placeholder: "0x..." }] },
  { key: "changeRequirement", label: "Change Threshold", description: "Update required approval count", category: "Governance", abi: MULTISIG_ABI, functionName: "changeRequirement", fields: [{ name: "_required", label: "Required Approvals", type: "uint256", placeholder: "2", hint: "Must be ≥1 and ≤ signer count" }] },
  // Treasury
  { key: "withdrawETH", label: "Withdraw ETH", description: "Send ETH from treasury", category: "Treasury", abi: TREASURY_ABI, functionName: "withdrawTreasuryETH", fields: [{ name: "_to", label: "Recipient", type: "address", placeholder: "0x..." }, { name: "_amount", label: "Amount", type: "uint256", placeholder: "0.1", humanDecimals: 18, humanSymbol: "ETH" }] },
  { key: "withdrawERC20", label: "Withdraw Tokens", description: "Send ERC20 tokens from treasury", category: "Treasury", abi: TREASURY_ABI, functionName: "withdrawTreasuryERC20", fields: [{ name: "_to", label: "Recipient", type: "address", placeholder: "0x..." }, { name: "_amount", label: "Amount", type: "uint256", placeholder: "100", humanDecimals: 18, humanSymbol: "PRM" }] },
  // Marketplace
  { key: "listNFT", label: "List NFT", description: "List a single NFT on the marketplace priced in ERC20", category: "Marketplace", abi: MARKETPLACE_ABI, functionName: "listNFT", fields: [{ name: "_tokenId", label: "Token ID", type: "uint256", placeholder: "0", hint: "ID of the NFT to list" }, { name: "_price", label: "Listing price", type: "uint256", placeholder: "1", hint: "Price in PRM (e.g. 1 = 1 PRM)", humanDecimals: 18, humanSymbol: "PRM" }] },
  { key: "batchListNFT", label: "Batch List NFTs", description: "List a range of NFTs at the same ERC20 price", category: "Marketplace", abi: MARKETPLACE_ABI, functionName: "batchListNFT", fields: [{ name: "_tokenIds", label: "Token ID Range", type: "uint256[]", placeholder: "", hint: "All token IDs in this range will be listed (max 100)", rangeInput: true }, { name: "_price", label: "Price per NFT", type: "uint256", placeholder: "1", hint: "Same PRM price for each NFT in the range", humanDecimals: 18, humanSymbol: "PRM" }] },
  { key: "setPlatformFee", label: "Set Platform Fee", description: "Update marketplace commission rate", category: "Marketplace", abi: MARKETPLACE_ABI, functionName: "setPlatformFee", fields: [{ name: "_feeBps", label: "Fee (basis points)", type: "uint256", placeholder: "250", hint: "100 bps = 1%" }] },
  // Borrow
  { key: "setERC20PerEth", label: "Set Token Rate", description: "How many PRM equal 1 ETH for borrow collateral math", category: "Borrow", abi: BORROW_ABI, functionName: "setERC20PerEth", fields: [{ name: "_erc20PerEth", label: "PRM per 1 ETH", type: "uint256", placeholder: "1000", hint: "Whole or decimal PRM per one ETH", humanDecimals: 18, humanSymbol: "PRM" }] },
  // Staking (human-friendly: days + percents 0–100 in UI → seconds + bps on-chain)
  {
    key: "setStakeDurations",
    label: "Set Stake Durations",
    description: "Replace all lock tiers and per-tier staker fee share (borrow fee split)",
    category: "Staking",
    abi: STAKING_ABI,
    functionName: "setStakeDurations",
    fields: [
      {
        name: "_durations",
        label: "Lock length per tier (days, comma-separated)",
        type: "uint256[]",
        placeholder: "7, 30, 90",
        hint: "Converted to seconds on-chain (×86400)",
      },
      {
        name: "_rewardBps",
        label: "Staker share of borrow fee per tier (percent 0–100, comma-separated)",
        type: "uint256[]",
        placeholder: "75, 80, 85",
        hint: "Same length as tiers; converted to basis points (×100)",
      },
    ],
  },
  {
    key: "initStaking",
    label: "Initialize Staking (once)",
    description: "Only when no tiers exist yet — sets tiers + global staker split (same as fresh deploy path)",
    category: "Staking",
    abi: STAKING_ABI,
    functionName: "initStaking",
    fields: [
      {
        name: "_durations",
        label: "Lock length per tier (days, comma-separated)",
        type: "uint256[]",
        placeholder: "3, 7, 14",
        hint: "Converted to seconds (×86400)",
      },
      {
        name: "_rewardBps",
        label: "Staker share per tier (percent 0–100, comma-separated)",
        type: "uint256[]",
        placeholder: "70, 80, 90",
        hint: "Same length as tiers; converted to bps (×100)",
      },
      {
        name: "_stakerBps",
        label: "Global staker share of borrow fee (percent 0–100)",
        type: "uint256",
        placeholder: "80",
        hint: "Converted to basis points (×100), e.g. 80 → 8000",
      },
    ],
  },
  { key: "setRewardSplit", label: "Set Reward Split", description: "Update global staker reward percentage (borrow fee)", category: "Staking", abi: STAKING_ABI, functionName: "setRewardSplit", fields: [{ name: "_stakerBps", label: "Staker share (percent 0–100)", type: "uint256", placeholder: "80", hint: "e.g. 80 → 8000 bps on-chain" }] },
  // Admin
  { key: "transferOwnership", label: "Transfer Ownership", description: "Transfer diamond ownership", category: "Admin", abi: OWNERSHIP_ABI, functionName: "transferOwnership", fields: [{ name: "_newOwner", label: "New Owner Address", type: "address", placeholder: "0x..." }] },
  { key: "setFaucetAmount", label: "Faucet: Claim Amount", description: "PRM amount per faucet claim (multisig)", category: "Faucet", abi: FAUCET_ABI, functionName: "setFaucetAmount", fields: [{ name: "_amount", label: "Amount per claim", type: "uint256", placeholder: "100", hint: "PRM each user receives per claim", humanDecimals: 18, humanSymbol: "PRM" }] },
  { key: "setFaucetCooldown", label: "Faucet: Cooldown", description: "Seconds between claims per wallet (multisig)", category: "Faucet", abi: FAUCET_ABI, functionName: "setFaucetCooldown", fields: [{ name: "_cooldown", label: "Cooldown (seconds)", type: "uint256", placeholder: "43200", hint: "43200 = 12 hours" }] },
];

const CATEGORIES = ["NFT", "Token", "Faucet", "Governance", "Treasury", "Marketplace", "Borrow", "Staking", "Admin"];

const CAT_ICONS: Record<string, React.ReactNode> = {
  NFT: <span>🎨</span>, Token: <Coins size={13} />, Faucet: <Droplets size={13} />, Governance: <Shield size={13} />,
  Treasury: <Vault size={13} />, Marketplace: <ShoppingBag size={13} />,
  Borrow: <Landmark size={13} />, Staking: <Activity size={13} />, Admin: <Lock size={13} />,
  Diamond: <Sparkles size={13} />, Raw: <Code size={13} />,
};

const ZERO_ADDR = "0x0000000000000000000000000000000000000000" as const;

type DecodedProposal = { label: string; category: string; lines: string[] };

function formatDiamondCutArgs(args: readonly unknown[]): DecodedProposal {
  const cuts = args[0] as { facetAddress: `0x${string}`; action: number; functionSelectors: `0x${string}`[] }[];
  const init = args[1] as `0x${string}`;
  const initCalldata = args[2] as Hex;
  const actionNames = ["Add", "Replace", "Remove"];
  const lines: string[] = [];
  cuts.forEach((c, i) => {
    const act = actionNames[c.action] ?? `Action ${c.action}`;
    lines.push(
      `Cut ${i + 1}: ${act} · facet ${shortenAddress(c.facetAddress)} · ${c.functionSelectors.length} selector(s)`
    );
  });
  if (init && init.toLowerCase() !== ZERO_ADDR) lines.push(`Init target: ${shortenAddress(init)}`);
  if (initCalldata && initCalldata !== "0x" && initCalldata.length > 2)
    lines.push(`Init calldata: ${(initCalldata.length - 2) / 2} bytes`);
  return { label: "Diamond upgrade (diamondCut)", category: "Diamond", lines };
}

function tryDecodeMintERC20(data: Hex): DecodedProposal | null {
  try {
    const d = decodeFunctionData({ abi: ERC20_ABI as Abi, data });
    if (d.functionName !== "mintERC20") return null;
    const [to, amount] = d.args as [`0x${string}`, bigint];
    const fund = to.toLowerCase() === DIAMOND_ADDRESS.toLowerCase();
    return {
      label: fund ? "Fund Faucet" : "Mint Tokens",
      category: "Token",
      lines: [
        fund ? "Recipient: Prism diamond (faucet pool)" : `Recipient: ${shortenAddress(to)}`,
        `Amount: ${amount.toString()} wei (~${formatToken(amount)} PRM)`,
      ],
    };
  } catch {
    return null;
  }
}

function formatActionArgs(action: ActionDef, args: readonly unknown[]): string[] {
  if (!action.fields.length) return ["No parameters."];
  const lines: string[] = [];
  action.fields.forEach((f, i) => {
    const v = args[i];
    if (f.type === "address") lines.push(`${f.label}: ${shortenAddress(String(v))}`);
    else if (f.type === "uint256") lines.push(`${f.label}: ${(v as bigint).toString()}`);
    else if (f.type === "uint256[]") {
      const arr = v as bigint[];
      if (!arr.length) lines.push(`${f.label}: (empty)`);
      else if (arr.length <= 12) lines.push(`${f.label}: ${arr.map((x) => x.toString()).join(", ")}`);
      else
        lines.push(
          `${f.label}: ${arr.length} ids (${arr[0].toString()} … ${arr[arr.length - 1].toString()})`
        );
    }
  });
  return lines;
}

function formatExtraInit(name: string, args: readonly unknown[]): string[] {
  if (name === "initMultisig") {
    const owners = args[0] as `0x${string}`[];
    const req = args[1] as bigint;
    return [
      `${owners.length} owner(s): ${owners.map((o) => shortenAddress(o)).join(", ")}`,
      `Required approvals: ${req.toString()}`,
    ];
  }
  if (name === "initialize") {
    return [`Collection name: ${String(args[0])}`, `Symbol: ${String(args[1])}`];
  }
  if (name === "initERC20") {
    return [
      `Name: ${String(args[0])}`,
      `Symbol: ${String(args[1])}`,
      `Decimals: ${String(args[2])}`,
    ];
  }
  if (name === "initStaking") {
    const durs = args[0] as bigint[];
    const bps = args[1] as bigint[];
    const globalBps = args[2] as bigint;
    return [
      `Tiers: ${durs.length} (durations in seconds: ${durs.map((x) => x.toString()).join(", ")})`,
      `Per-tier staker bps: ${bps.map((x) => x.toString()).join(", ")}`,
      `Global staker bps: ${globalBps.toString()}`,
    ];
  }
  return args.map((a, i) => `Arg ${i + 1}: ${String(a)}`);
}

/** Human-readable title + bullet lines for multisig proposal calldata. */
function decodeProposalCalldata(callData: string | undefined): DecodedProposal {
  if (!callData || callData.length < 10) {
    return { label: "Empty proposal", category: "Raw", lines: ["No calldata."] };
  }
  const data = callData as Hex;

  try {
    const d = decodeFunctionData({ abi: DIAMOND_CUT_ABI as Abi, data });
    if (d.functionName === "diamondCut") return formatDiamondCutArgs(d.args ?? []);
  } catch { /* not diamondCut */ }

  const mint = tryDecodeMintERC20(data);
  if (mint) return mint;

  for (const action of PROPOSAL_ACTIONS) {
    if (action.key === "fundFaucet" || action.key === "mintERC20") continue;
    try {
      const d = decodeFunctionData({ abi: action.abi as Abi, data });
      if (d.functionName !== action.functionName) continue;
      const lines = formatActionArgs(action, d.args ?? []);
      return { label: action.label, category: action.category, lines };
    } catch { /* try next */ }
  }

  const extras: { abi: Abi; map: Record<string, { label: string; category: string }> }[] = [
    {
      abi: MULTISIG_ABI as Abi,
      map: { initMultisig: { label: "Initialize multisig", category: "Governance" } },
    },
    {
      abi: ERC721_ABI as Abi,
      map: { initialize: { label: "Initialize NFT collection", category: "NFT" } },
    },
    {
      abi: ERC20_ABI as Abi,
      map: { initERC20: { label: "Initialize ERC20 token", category: "Token" } },
    },
    {
      abi: STAKING_ABI as Abi,
      map: { initStaking: { label: "Initialize staking (once)", category: "Staking" } },
    },
  ];
  for (const { abi, map } of extras) {
    try {
      const d = decodeFunctionData({ abi, data });
      const meta = map[d.functionName];
      if (!meta) continue;
      return {
        label: meta.label,
        category: meta.category,
        lines: formatExtraInit(d.functionName, d.args ?? []),
      };
    } catch { /* */ }
  }

  return {
    label: "Unknown action",
    category: "Raw",
    lines: [
      `Function selector: ${callData.slice(0, 10)}`,
      "This calldata does not match a known Prism governance action. Expand \"Raw calldata\" below or verify the proposal on a block explorer.",
    ],
  };
}

function parseUint256Field(f: FieldDef, raw: string): bigint {
  const val = raw.trim();
  if (!val) throw new Error(`${f.label} is required`);
  if (f.humanDecimals != null) {
    try {
      return parseUnits(val, f.humanDecimals);
    } catch {
      throw new Error(`Invalid amount for "${f.label}" — use a number like 1 or 0.25`);
    }
  }
  return BigInt(val);
}

function parseCommaSeparatedDaysToSeconds(csv: string): bigint[] {
  const parts = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter at least one day value (comma-separated).");
  return parts.map((p) => {
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid day value: ${p}`);
    return BigInt(Math.round(n * 86400));
  });
}

function parseCommaSeparatedPercentsToBps(csv: string): bigint[] {
  const parts = csv.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter at least one percent (comma-separated).");
  return parts.map((p) => {
    const n = Number(p);
    if (!Number.isFinite(n) || n <= 0 || n > 100) throw new Error(`Invalid percent (use 0–100 per tier): ${p}`);
    return BigInt(Math.round(n * 100));
  });
}

function parseSinglePercentToBps(raw: string): bigint {
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new Error("Enter a percent from 0 to 100.");
  return BigInt(Math.round(n * 100));
}

function buildCalldata(action: ActionDef, values: Record<string, string>): `0x${string}` {
  if (action.key === "setRewardSplit") {
    const bps = parseSinglePercentToBps(values["_stakerBps"] ?? "");
    return encodeFunctionData({
      abi: action.abi as Abi,
      functionName: "setRewardSplit",
      args: [bps],
    });
  }
  if (action.key === "setStakeDurations") {
    const durations = parseCommaSeparatedDaysToSeconds(values["_durations"] ?? "");
    const rewardBps = parseCommaSeparatedPercentsToBps(values["_rewardBps"] ?? "");
    if (durations.length !== rewardBps.length) {
      throw new Error("Number of day tiers must match number of percent tiers.");
    }
    return encodeFunctionData({
      abi: action.abi as Abi,
      functionName: "setStakeDurations",
      args: [durations, rewardBps],
    });
  }
  if (action.key === "initStaking") {
    const durations = parseCommaSeparatedDaysToSeconds(values["_durations"] ?? "");
    const rewardBps = parseCommaSeparatedPercentsToBps(values["_rewardBps"] ?? "");
    if (durations.length !== rewardBps.length) {
      throw new Error("Number of day tiers must match number of percent tiers.");
    }
    const stakerBps = parseSinglePercentToBps(values["_stakerBps"] ?? "");
    return encodeFunctionData({
      abi: action.abi as Abi,
      functionName: "initStaking",
      args: [durations, rewardBps, stakerBps],
    });
  }

  if (action.mintToDiamond && action.functionName === "mintERC20") {
    const val = (values["_amount"] ?? "").trim();
    const field = action.fields.find((x) => x.name === "_amount");
    if (!field) throw new Error("Missing amount field");
    const amount = parseUint256Field(field, val);
    return encodeFunctionData({
      abi: action.abi as any,
      functionName: "mintERC20",
      args: [DIAMOND_ADDRESS, amount],
    });
  }

  const args = action.fields.map((f) => {
    const val = (values[f.name] ?? "").trim();
    if (f.type === "uint256[]") {
      if (f.rangeInput) {
        const from = parseInt((values[`${f.name}_from`] ?? "").trim());
        const to   = parseInt((values[`${f.name}_to`]   ?? "").trim());
        if (isNaN(from) || isNaN(to)) throw new Error(`Enter a valid range for "${f.label}"`);
        if (to < from) throw new Error(`"To" must be ≥ "From" for "${f.label}"`);
        if (to - from > 99) throw new Error(`Max 100 tokens per batch`);
        return Array.from({ length: to - from + 1 }, (_, i) => BigInt(from + i));
      }
      const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
      if (!parts.length) throw new Error(`${f.label} is required`);
      return parts.map((p) => BigInt(p));
    }
    if (f.type === "uint256") {
      return parseUint256Field(f, val);
    }
    if (!val.startsWith("0x") || val.length !== 42) throw new Error(`Invalid address for "${f.label}"`);
    return val as `0x${string}`;
  });
  return encodeFunctionData({ abi: action.abi as any, functionName: action.functionName as any, args: args as any });
}

// ─── Smart Propose Modal ───────────────────────────────────────────────────────
function SmartProposeModal({ isOpen, onClose, onSuccess, onError, prefillAction, prefillValues }: {
  isOpen: boolean; onClose: () => void;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
  prefillAction?: string; prefillValues?: Record<string, string>;
}) {
  const [selectedCat, setSelectedCat] = useState("NFT");
  const [selectedKey, setSelectedKey] = useState<string | null>(prefillAction ?? null);
  const [values, setValues] = useState<Record<string, string>>(prefillValues ?? {});
  const { propose, isPending } = usePropose();

  const handleClose = () => {
    if (!prefillAction) { setSelectedKey(null); setValues({}); setSelectedCat("NFT"); }
    onClose();
  };

  const action = PROPOSAL_ACTIONS.find((a) => a.key === selectedKey);

  const handleSubmit = async () => {
    if (!action) return;
    try {
      const callData = buildCalldata(action, values);
      await propose(callData);
      onSuccess(`Proposal submitted: ${action.label}`);
      handleClose();
    } catch (e: any) {
      onError(e?.message?.slice(0, 150) || "Failed to submit proposal");
    }
  };

  const canSubmit = !isPending && action
    && action.fields.every((f) => {
      if (f.type === "uint256[]" && f.rangeInput)
        return (values[`${f.name}_from`] ?? "").trim() !== "" && (values[`${f.name}_to`] ?? "").trim() !== "";
      return (values[f.name] ?? "").trim() !== "";
    });

  return (
    <Modal
      isOpen={isOpen} onClose={handleClose}
      title={action ? `Propose: ${action.label}` : "New Proposal"}
      subtitle={action ? action.description : "Select an action — it will go through multisig approval before executing"}
    >
      <div className="space-y-4">
        {/* ── STEP 1: pick action ───────────────────────────────── */}
        {!action && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCat === cat
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {PROPOSAL_ACTIONS.filter((a) => a.category === selectedCat).map((a) => (
                <button key={a.key}
                  onClick={() => { setSelectedKey(a.key); setValues({}); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200
                    hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-violet-100
                    flex items-center justify-center flex-shrink-0 transition-colors">
                    {CAT_ICONS[a.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-500">{a.description}</p>
                  </div>
                  <ChevronDown size={13} className="text-slate-400 -rotate-90 flex-shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 2: fill form ─────────────────────────────────── */}
        {action && (
          <>
            {!prefillAction && (
              <button onClick={() => { setSelectedKey(null); setValues({}); }}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors">
                <ArrowLeft size={13} /> Back to action list
              </button>
            )}

            <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
              <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {CAT_ICONS[action.category]}
              </div>
              <div>
                <p className="text-sm font-bold text-violet-900">{action.label}</p>
                <p className="text-xs text-violet-600 font-mono">{action.functionName}()</p>
              </div>
            </div>

            {action.fields.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-2 bg-slate-50 rounded-xl">
                No parameters needed — ready to submit.
              </p>
            )}

            {action.fields.map((f) => {
              // Range input — From / To number pair (for uint256[] fields)
              if (f.type === "uint256[]" && f.rangeInput) {
                const from = values[`${f.name}_from`] ?? "";
                const to   = values[`${f.name}_to`]   ?? "";
                const count = from !== "" && to !== "" && !isNaN(+from) && !isNaN(+to) && +to >= +from
                  ? +to - +from + 1 : null;
                return (
                  <div key={f.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">{f.label}</label>
                      {count !== null && (
                        <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                          {count} token{count !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">From Token ID</label>
                        <input
                          type="number" min="0" placeholder="0"
                          value={from}
                          onChange={(e) => setValues((v) => ({ ...v, [`${f.name}_from`]: e.target.value }))}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">To Token ID</label>
                        <input
                          type="number" min="0" placeholder="9"
                          value={to}
                          onChange={(e) => setValues((v) => ({ ...v, [`${f.name}_to`]: e.target.value }))}
                          className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                            focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                    {f.hint && <p className="text-xs text-slate-500">{f.hint}</p>}
                  </div>
                );
              }
              // Default — single value input
              return (
                <Input
                  key={f.name}
                  label={f.label}
                  placeholder={f.placeholder}
                  hint={f.hint}
                  type={f.humanDecimals != null ? "text" : undefined}
                  inputMode={f.humanDecimals != null ? "decimal" : undefined}
                  autoComplete="off"
                  suffix={f.humanSymbol}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              );
            })}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 space-y-1">
              <p className="font-semibold">How this works</p>
              <p>• Submits a <strong>proposal</strong> — not an immediate action</p>
              <p>• Other signers approve, then anyone can execute once threshold is met</p>
              <p>
                • PRM and ETH amounts use normal decimals (e.g. <span className="font-mono">1</span> = one token); 18-decimal
                conversion is applied for you. Basis points and raw IDs stay numeric as before.
              </p>
            </div>

            <Button fullWidth variant="primary" loading={isPending} disabled={!canSubmit}
              onClick={handleSubmit} icon={<Shield size={14} />}>
              Submit Proposal
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Init Multisig Panel ───────────────────────────────────────────────────────
function InitMultisigPanel({ onSuccess, onError, refetchOwners }: {
  onSuccess: (msg: string) => void; onError: (msg: string) => void; refetchOwners: () => void;
}) {
  const { address } = useAccount();
  const [ownerInputs, setOwnerInputs] = useState<string[]>([address ?? ""]);
  const [required, setRequired] = useState("1");
  const { init, isPending, isSuccess } = useInitMultisig();

  if (isSuccess) { refetchOwners(); onSuccess("Multisig initialized!"); }

  const addRow = () => setOwnerInputs((p) => [...p, ""]);
  const removeRow = (i: number) => setOwnerInputs((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, val: string) => setOwnerInputs((p) => p.map((v, idx) => idx === i ? val : v));

  const handleInit = () => {
    const valid = ownerInputs.map((o) => o.trim()).filter((o) => o.startsWith("0x") && o.length === 42) as `0x${string}`[];
    if (!valid.length) { onError("Add at least one valid address."); return; }
    const req = parseInt(required);
    if (isNaN(req) || req < 1 || req > valid.length) { onError(`Required must be 1–${valid.length}.`); return; }
    try { init(valid, BigInt(req)); }
    catch (e: any) { onError(e?.message?.slice(0, 80) || "Failed"); }
  };

  return (
    <Card accent="violet">
      <CardHeader>
        <CardTitle>Initialize Multisig</CardTitle>
        <Badge color="amber" dot>Not Set Up</Badge>
      </CardHeader>
      <p className="text-sm text-slate-500 mb-5">
        The multisig has not been initialized yet. As the contract deployer, set the initial
        signer set and approval threshold below.
      </p>
      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium text-slate-700">Signer Addresses</label>
        {ownerInputs.map((val, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
              font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
              placeholder="0x..." value={val} onChange={(e) => updateRow(i, e.target.value)}
            />
            {ownerInputs.length > 1 && (
              <button onClick={() => removeRow(i)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-rose-200
                  text-rose-400 hover:bg-rose-50 transition-colors">
                <UserMinus size={15} />
              </button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" icon={<UserPlus size={14} />} onClick={addRow}>
          Add Another Signer
        </Button>
      </div>
      <div className="mb-4">
        <Input label={`Required Approvals (max ${ownerInputs.length})`} type="number"
          min="1" max={ownerInputs.length} value={required}
          onChange={(e) => setRequired(e.target.value)}
          hint={`${required} of ${ownerInputs.length} signers must approve before any action executes`}
        />
      </div>
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700 mb-4 space-y-1">
        <p className="font-semibold">Before you submit</p>
        <p>• {ownerInputs.filter((o) => o.startsWith("0x")).length} signer(s) will be registered</p>
        <p>• {required} of {ownerInputs.length} approvals needed to execute proposals</p>
        <p>• <strong>This function can only be called once</strong> — double-check all addresses</p>
      </div>
      <Button fullWidth variant="primary" loading={isPending} onClick={handleInit} icon={<Shield size={14} />}>
        Initialize Multisig
      </Button>
    </Card>
  );
}

// ─── Owner Management Panel ────────────────────────────────────────────────────
function OwnerManagementPanel({ owners, required, refetch, onPropose }: {
  owners: string[]; required: bigint; refetch: () => void;
  onPropose: (action: string, prefill?: Record<string, string>) => void;
}) {
  const { address } = useAccount();
  const [addAddr, setAddAddr] = useState("");
  const [replaceOld, setReplaceOld] = useState("");
  const [replaceNew, setReplaceNew] = useState("");
  const [newRequired, setNewRequired] = useState(required.toString());
  const [replaceOpen, setReplaceOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Signers list */}
      <Card>
        <CardHeader>
          <CardTitle>Signers</CardTitle>
          <Badge color="violet">{required.toString()} of {owners.length} required</Badge>
        </CardHeader>

        <div className="space-y-1 mb-4">
          {owners.map((owner, i) => (
            <div key={owner} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 group">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-400 to-purple-500 rounded-lg
                flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <a href={addressUrl(owner)} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-sm font-mono text-slate-600 hover:text-violet-700 truncate">
                {owner}
              </a>
              {owner.toLowerCase() === address?.toLowerCase() && (
                <Badge color="violet" size="sm">You</Badge>
              )}
              <button
                onClick={() => onPropose("removeOwner", { _owner: owner })}
                title="Propose removal"
                disabled={owners.length <= 1}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center
                  rounded-lg text-rose-400 hover:bg-rose-50 transition-all disabled:opacity-20"
              >
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add signer row */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
              font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
            placeholder="0x... new signer address"
            value={addAddr}
            onChange={(e) => setAddAddr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && addAddr) {
                onPropose("addOwner", { _owner: addAddr });
                setAddAddr("");
              }
            }}
          />
          <Button variant="primary" size="sm"
            disabled={!addAddr}
            onClick={() => { onPropose("addOwner", { _owner: addAddr }); setAddAddr(""); }}
            icon={<UserPlus size={14} />}>
            Propose Add
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Adding/removing signers creates a proposal for multisig approval.</p>
      </Card>

      {/* Replace owner */}
      <Card>
        <div className="flex items-center justify-between cursor-pointer"
          onClick={() => setReplaceOpen((v) => !v)}>
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Replace a Signer</span>
          </div>
          {replaceOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {replaceOpen && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Signer to Replace</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                  focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
                value={replaceOld} onChange={(e) => setReplaceOld(e.target.value)}
              >
                <option value="">Select existing signer…</option>
                {owners.map((o) => <option key={o} value={o}>{shortenAddress(o, 10)}</option>)}
              </select>
            </div>
            <Input label="New Signer Address" placeholder="0x..."
              value={replaceNew} onChange={(e) => setReplaceNew(e.target.value)} />
            <Button fullWidth variant="secondary"
              disabled={!replaceOld || !replaceNew}
              onClick={() => { onPropose("replaceOwner", { _oldOwner: replaceOld, _newOwner: replaceNew }); setReplaceOld(""); setReplaceNew(""); setReplaceOpen(false); }}
              icon={<ArrowLeftRight size={14} />}>
              Propose Replace
            </Button>
          </div>
        )}
      </Card>

      {/* Change threshold */}
      <Card>
        <CardHeader><CardTitle>Approval Threshold</CardTitle></CardHeader>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input label={`Required approvals (1 – ${owners.length})`} type="number"
              min="1" max={owners.length} value={newRequired}
              onChange={(e) => setNewRequired(e.target.value)} suffix={`of ${owners.length}`}
            />
          </div>
          <Button variant="secondary" size="md"
            disabled={newRequired === required.toString()}
            onClick={() => onPropose("changeRequirement", { _required: newRequired })}>
            Propose
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Proposal Row ──────────────────────────────────────────────────────────────
function ProposalRow({ proposalId, userAddress, onSuccess, onError }: {
  proposalId: bigint; userAddress?: string;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiRisk, setAiRisk] = useState<"low" | "medium" | "high" | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { data: proposal, refetch } = useProposal(proposalId);
  const { data: hasApproved, refetch: refetchApproval } = useHasApproved(proposalId, userAddress);
  const { data: required } = useMultisigRequired();
  const { approve, isPending: approving } = useApproveProposal();
  const { revoke, isPending: revoking } = useRevokeApproval();
  const { execute, isPending: executing } = useExecuteProposal();

  if (!proposal || proposal[0] === "0x0000000000000000000000000000000000000000") return null;
  const [proposer, callData, approvalCount, executed] = proposal as [string, string, bigint, boolean];
  const canExecute = required !== undefined && approvalCount >= (required as bigint) && !executed;
  const decoded = decodeProposalCalldata(callData);

  const run = async (fn: () => any, msg: string) => {
    try { await fn(); refetch(); refetchApproval(); onSuccess(msg); }
    catch (e: any) { onError(e?.message?.slice(0, 80) || "Failed"); }
  };

  const loadAiSummary = async () => {
    setAiError(null); setAiLoading(true);
    try {
      const out = await fetchGovernanceSummary({
        proposalId: proposalId.toString(), proposer,
        callData: callData || "0x", approvalCount: approvalCount.toString(),
        executed, requiredApprovals: required !== undefined ? (required as bigint).toString() : undefined,
        contractAddress: DIAMOND_ADDRESS,
      });
      setAiSummary(out.summary); setAiRisk(out.risk ?? null); setAiNotes(out.notes ?? null);
    } catch (e: any) {
      setAiSummary(null); setAiRisk(null); setAiNotes(null);
      setAiError(e?.message?.slice(0, 200) || "AI request failed");
    } finally { setAiLoading(false); }
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${executed ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <div className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          executed ? "bg-slate-100" : canExecute ? "bg-emerald-100" : "bg-amber-100"
        }`}>
          {executed ? <CheckCircle size={16} className="text-slate-400" />
            : canExecute ? <Play size={16} className="text-emerald-600" />
            : <Clock size={16} className="text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">Proposal #{proposalId.toString()}</span>
            <Badge color="violet" size="sm">{decoded.category}</Badge>
            {executed && <Badge color="slate" size="sm">Executed</Badge>}
            {!executed && canExecute && <Badge color="emerald" size="sm" dot>Ready</Badge>}
            {!executed && !canExecute && <Badge color="amber" size="sm">Pending</Badge>}
          </div>
          <p className="text-sm font-semibold text-slate-800 mt-1 leading-snug">{decoded.label}</p>
          <p className="text-xs text-slate-400 mt-0.5">By {shortenAddress(proposer)}</p>
        </div>
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
          {approvalCount.toString()}/{(required as bigint)?.toString() ?? "?"} approvals
        </span>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-3 space-y-2">
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Decoded action</p>
            <p className="text-base font-bold text-slate-900">{decoded.label}</p>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside marker:text-violet-400">
              {decoded.lines.map((line, i) => (
                <li key={i} className="leading-relaxed">{line}</li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Raw calldata</p>
            <div className="bg-slate-50 rounded-lg p-2 font-mono text-xs text-slate-600 break-all">{callData || "0x"}</div>
          </div>

          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-xs font-semibold text-violet-800">AI proposal summary</p>
              {aiRisk && (
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                  aiRisk === "low" ? "bg-emerald-100 text-emerald-700"
                    : aiRisk === "high" ? "bg-rose-100 text-rose-700"
                    : "bg-amber-100 text-amber-800"
                }`}>Risk: {aiRisk}</span>
              )}
            </div>
            {!isGovernanceAiConfigured() ? (
              <p className="text-xs text-violet-600/80">
                Set <span className="font-mono">VITE_AI_GOVERNANCE_URL</span> in{" "}
                <span className="font-mono">.env</span> and run the optional proxy in <span className="font-mono">server/</span>.
              </p>
            ) : (
              <>
                <Button size="sm" variant="secondary" loading={aiLoading} disabled={aiLoading}
                  onClick={(e) => { e.stopPropagation(); loadAiSummary(); }} icon={<Sparkles size={13} />}>
                  {aiSummary ? "Regenerate" : "Generate AI analysis"}
                </Button>
                {aiError && <p className="text-xs text-rose-600">{aiError}</p>}
                {aiSummary && <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>}
                {aiNotes && <p className="text-xs text-slate-500 border-t border-violet-100 pt-2">{aiNotes}</p>}
              </>
            )}
          </div>

          {!executed && (
            <div className="flex gap-2 flex-wrap">
              {!hasApproved
                ? <Button size="sm" variant="primary" loading={approving}
                    onClick={() => run(() => approve(proposalId), `Proposal #${proposalId} approved!`)}
                    icon={<CheckCircle size={13} />}>Approve</Button>
                : <Button size="sm" variant="ghost" loading={revoking}
                    onClick={() => run(() => revoke(proposalId), "Approval revoked")}
                    icon={<XCircle size={13} />}>Revoke</Button>}
              {canExecute && (
                <Button size="sm" variant="success" loading={executing}
                  onClick={() => run(() => execute(proposalId), `Proposal #${proposalId} executed!`)}
                  icon={<Play size={13} />}>Execute</Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
const MAX_PROPOSALS = 20;

export function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { data: owners, refetch: refetchOwners } = useMultisigOwners();
  const { data: required } = useMultisigRequired();
  const { toasts, success, error, removeToast } = useToast();

  const [proposeOpen, setProposeOpen] = useState(false);
  const [prefillAction, setPrefillAction] = useState<string | undefined>();
  const [prefillValues, setPrefillValues] = useState<Record<string, string> | undefined>();

  const openPropose = (action?: string, values?: Record<string, string>) => {
    setPrefillAction(action);
    setPrefillValues(values);
    setProposeOpen(true);
  };

  const ownerList = (owners as string[] | undefined) ?? [];
  const isInitialized = ownerList.length > 0;
  const isOwner = ownerList.some((o) => o.toLowerCase() === address?.toLowerCase());
  const proposalIds = Array.from({ length: MAX_PROPOSALS }, (_, i) => BigInt(MAX_PROPOSALS - 1 - i));

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-slate-500">Connect your wallet to view governance.</p>
        <AppKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Governance"
        subtitle="Multisig proposals — every privileged action requires consensus"
        action={
          isInitialized && isOwner ? (
            <Button variant="primary" size="sm" icon={<Shield size={14} />}
              onClick={() => openPropose()}>
              New Proposal
            </Button>
          ) : undefined
        }
      />

      {!isInitialized && (
        <InitMultisigPanel
          onSuccess={(msg) => success("Initialized!", msg)}
          onError={(msg) => error("Error", msg)}
          refetchOwners={refetchOwners}
        />
      )}

      {isInitialized && (
        <>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Signer Management</h2>
              <button onClick={() => refetchOwners()} className="text-slate-400 hover:text-slate-600 transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
            <OwnerManagementPanel
              owners={ownerList}
              required={(required as bigint) ?? 1n}
              refetch={refetchOwners}
              onPropose={openPropose}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recent Proposals</h2>
              {isOwner && (
                <Button variant="secondary" size="sm" icon={<Shield size={13} />}
                  onClick={() => openPropose()}>
                  New Proposal
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {proposalIds.map((id) => (
                <ProposalRow key={id.toString()} proposalId={id} userAddress={address}
                  onSuccess={(msg) => success("Done!", msg)}
                  onError={(msg) => error("Error", msg)} />
              ))}
              <p className="text-xs text-center text-slate-300 pt-2">Showing last {MAX_PROPOSALS} proposal slots</p>
            </div>
          </div>
        </>
      )}

      <SmartProposeModal
        isOpen={proposeOpen}
        onClose={() => { setProposeOpen(false); setPrefillAction(undefined); setPrefillValues(undefined); }}
        onSuccess={(msg) => success("Proposed!", msg)}
        onError={(msg) => error("Error", msg)}
        prefillAction={prefillAction}
        prefillValues={prefillValues}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}