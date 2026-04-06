import { useState } from "react";
import { useAccount } from "wagmi";
import {
  Shield, CheckCircle, Clock, XCircle, Play,
  ChevronDown, ChevronUp, UserPlus, UserMinus,
  RefreshCw, ArrowLeftRight
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
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DIAMOND_ADDRESS, MULTISIG_ABI } from "../config/contracts";
import { shortenAddress, addressUrl } from "../utils/formatters";

const CONTRACT = { address: DIAMOND_ADDRESS, abi: MULTISIG_ABI } as const;

// ─── Inline hooks for owner management ───────────────────────────────────────

function useInitMultisig() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const init = (owners: `0x${string}`[], required: bigint) =>
    writeContract({ ...CONTRACT, functionName: "initMultisig", args: [owners, required] });
  return { init, isPending, isSuccess };
}

function useAddOwner() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const addOwner = (owner: `0x${string}`) =>
    writeContract({ ...CONTRACT, functionName: "addOwner", args: [owner] });
  return { addOwner, isPending, isSuccess };
}

function useRemoveOwner() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const removeOwner = (owner: `0x${string}`) =>
    writeContract({ ...CONTRACT, functionName: "removeOwner", args: [owner] });
  return { removeOwner, isPending, isSuccess };
}

function useReplaceOwner() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const replaceOwner = (oldOwner: `0x${string}`, newOwner: `0x${string}`) =>
    writeContract({ ...CONTRACT, functionName: "replaceOwner", args: [oldOwner, newOwner] });
  return { replaceOwner, isPending, isSuccess };
}

function useChangeRequirement() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  const change = (required: bigint) =>
    writeContract({ ...CONTRACT, functionName: "changeRequirement", args: [required] });
  return { change, isPending, isSuccess };
}

// ─── Init Multisig Panel ──────────────────────────────────────────────────────

function InitMultisigPanel({ onSuccess, onError, refetchOwners }: {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  refetchOwners: () => void;
}) {
  const { address } = useAccount();
  const [ownerInputs, setOwnerInputs] = useState<string[]>([address ?? ""]);
  const [required, setRequired] = useState("1");
  const { init, isPending, isSuccess } = useInitMultisig();

  if (isSuccess) {
    refetchOwners();
    onSuccess("Multisig initialized!");
  }

  const addRow = () => setOwnerInputs((p) => [...p, ""]);
  const removeRow = (i: number) => setOwnerInputs((p) => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, val: string) =>
    setOwnerInputs((p) => p.map((v, idx) => (idx === i ? val : v)));

  const handleInit = () => {
    const validOwners = ownerInputs
      .map((o) => o.trim())
      .filter((o) => o.startsWith("0x") && o.length === 42) as `0x${string}`[];
    if (validOwners.length === 0) { onError("Add at least one valid address."); return; }
    const req = parseInt(required);
    if (isNaN(req) || req < 1 || req > validOwners.length) {
      onError(`Required must be 1–${validOwners.length}.`); return;
    }
    try { init(validOwners, BigInt(req)); }
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
            <input
              className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
              placeholder="0x..."
              value={val}
              onChange={(e) => updateRow(i, e.target.value)}
            />
            {ownerInputs.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-rose-200
                  text-rose-400 hover:bg-rose-50 transition-colors"
              >
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
        <Input
          label={`Required Approvals (max ${ownerInputs.length})`}
          type="number"
          min="1"
          max={ownerInputs.length}
          value={required}
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

      <Button fullWidth variant="primary" loading={isPending} onClick={handleInit}
        icon={<Shield size={14} />}>
        Initialize Multisig
      </Button>
    </Card>
  );
}

// ─── Owner Management Panel ───────────────────────────────────────────────────

function OwnerManagementPanel({ owners, required, refetch, onSuccess, onError }: {
  owners: string[];
  required: bigint;
  refetch: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const { address } = useAccount();
  const [addAddr, setAddAddr] = useState("");
  const [replaceOld, setReplaceOld] = useState("");
  const [replaceNew, setReplaceNew] = useState("");
  const [newRequired, setNewRequired] = useState(required.toString());
  const [replaceOpen, setReplaceOpen] = useState(false);

  const { addOwner, isPending: adding } = useAddOwner();
  const { removeOwner, isPending: removing } = useRemoveOwner();
  const { replaceOwner, isPending: replacing } = useReplaceOwner();
  const { change, isPending: changingReq } = useChangeRequirement();

  const handleAdd = async () => {
    if (!addAddr.startsWith("0x") || addAddr.length !== 42) {
      onError("Invalid address"); return;
    }
    try {
      await addOwner(addAddr as `0x${string}`);
      setAddAddr(""); refetch();
      onSuccess(`${shortenAddress(addAddr)} added as signer`);
    } catch (e: any) { onError(e?.message?.slice(0, 80) || "Add failed"); }
  };

  const handleRemove = async (owner: string) => {
    try {
      await removeOwner(owner as `0x${string}`);
      refetch(); onSuccess(`${shortenAddress(owner)} removed`);
    } catch (e: any) { onError(e?.message?.slice(0, 80) || "Remove failed"); }
  };

  const handleReplace = async () => {
    if (!replaceOld || !replaceNew) return;
    try {
      await replaceOwner(replaceOld as `0x${string}`, replaceNew as `0x${string}`);
      setReplaceOld(""); setReplaceNew(""); setReplaceOpen(false);
      refetch(); onSuccess("Owner replaced");
    } catch (e: any) { onError(e?.message?.slice(0, 80) || "Replace failed"); }
  };

  const handleChangeReq = async () => {
    const r = parseInt(newRequired);
    if (isNaN(r) || r < 1 || r > owners.length) {
      onError(`Must be between 1 and ${owners.length}`); return;
    }
    try {
      await change(BigInt(r));
      refetch(); onSuccess(`Threshold updated to ${r}`);
    } catch (e: any) { onError(e?.message?.slice(0, 80) || "Failed"); }
  };

  return (
    <div className="space-y-4">
      {/* Current signers + add */}
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
                onClick={() => handleRemove(owner)}
                disabled={removing || owners.length <= 1}
                title="Remove signer"
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center
                  rounded-lg text-rose-400 hover:bg-rose-50 transition-all disabled:opacity-20"
              >
                <UserMinus size={13} />
              </button>
            </div>
          ))}
        </div>

        {/* Add owner row */}
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <input
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
              font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white transition-all"
            placeholder="0x... new signer address"
            value={addAddr}
            onChange={(e) => setAddAddr(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button variant="primary" size="sm" loading={adding}
            disabled={!addAddr || adding} onClick={handleAdd} icon={<UserPlus size={14} />}>
            Add
          </Button>
        </div>
      </Card>

      {/* Replace owner — collapsible */}
      <Card>
        <div className="flex items-center justify-between cursor-pointer"
          onClick={() => setReplaceOpen((v) => !v)}>
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Replace a Signer</span>
          </div>
          {replaceOpen
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />}
        </div>

        {replaceOpen && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Signer to Replace</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-sm px-3
                  focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white"
                value={replaceOld}
                onChange={(e) => setReplaceOld(e.target.value)}
              >
                <option value="">Select existing signer…</option>
                {owners.map((o) => (
                  <option key={o} value={o}>{shortenAddress(o, 10)}</option>
                ))}
              </select>
            </div>
            <Input label="New Signer Address" placeholder="0x..."
              value={replaceNew} onChange={(e) => setReplaceNew(e.target.value)} />
            <Button fullWidth variant="secondary" loading={replacing}
              disabled={!replaceOld || !replaceNew || replacing} onClick={handleReplace}
              icon={<ArrowLeftRight size={14} />}>
              Replace Signer
            </Button>
          </div>
        )}
      </Card>

      {/* Change threshold */}
      <Card>
        <CardHeader><CardTitle>Approval Threshold</CardTitle></CardHeader>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={`Required approvals (1 – ${owners.length})`}
              type="number" min="1" max={owners.length}
              value={newRequired}
              onChange={(e) => setNewRequired(e.target.value)}
              suffix={`of ${owners.length}`}
            />
          </div>
          <Button variant="secondary" size="md" loading={changingReq}
            disabled={changingReq || newRequired === required.toString()}
            onClick={handleChangeReq}>
            Update
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Proposal Row ─────────────────────────────────────────────────────────────

function ProposalRow({ proposalId, userAddress, onSuccess, onError }: {
  proposalId: bigint;
  userAddress?: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: proposal, refetch } = useProposal(proposalId);
  const { data: hasApproved, refetch: refetchApproval } = useHasApproved(proposalId, userAddress);
  const { data: required } = useMultisigRequired();
  const { approve, isPending: approving } = useApproveProposal();
  const { revoke, isPending: revoking } = useRevokeApproval();
  const { execute, isPending: executing } = useExecuteProposal();

  // Proposal slot doesn't exist yet
  if (!proposal || proposal[0] === "0x0000000000000000000000000000000000000000") return null;

  const [proposer, callData, approvalCount, executed] = proposal as [string, string, bigint, boolean];
  const canExecute = required !== undefined && approvalCount >= (required as bigint) && !executed;

  const run = async (fn: () => Promise<void>, msg: string) => {
    try { await fn(); refetch(); refetchApproval(); onSuccess(msg); }
    catch (e: any) { onError(e?.message?.slice(0, 80) || "Failed"); }
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
            <span className="text-sm font-semibold text-slate-800 font-display">
              Proposal #{proposalId.toString()}
            </span>
            {executed && <Badge color="slate" size="sm">Executed</Badge>}
            {!executed && canExecute && <Badge color="emerald" size="sm" dot>Ready</Badge>}
            {!executed && !canExecute && <Badge color="amber" size="sm">Pending</Badge>}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">By {shortenAddress(proposer)}</p>
        </div>
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg flex-shrink-0">
          {approvalCount.toString()}/{(required as bigint)?.toString() ?? "?"} approvals
        </span>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">Calldata</p>
            <div className="bg-slate-50 rounded-lg p-2 font-mono text-xs text-slate-600 break-all">{callData || "0x"}</div>
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

// ─── Propose Modal ────────────────────────────────────────────────────────────

function ProposeModal({ isOpen, onClose, onSuccess, onError }: {
  isOpen: boolean; onClose: () => void;
  onSuccess: (msg: string) => void; onError: (msg: string) => void;
}) {
  const [callData, setCallData] = useState("0x");
  const { propose, isPending } = usePropose();
  const handle = async () => {
    try { await propose(callData as `0x${string}`); onSuccess("Proposal submitted!"); onClose(); }
    catch (e: any) { onError(e?.message?.slice(0, 80) || "Failed"); }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Proposal"
      subtitle="Encode a function call to be executed on the diamond after approval">
      <div className="space-y-4">
        <Input label="Calldata (hex)" placeholder="0x..." value={callData}
          onChange={(e) => setCallData(e.target.value)}
          hint="ABI-encoded function call — signers must reach threshold to execute" />
        <Button fullWidth variant="primary" loading={isPending}
          disabled={!callData || callData === "0x" || isPending} onClick={handle}>
          Submit Proposal
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const MAX_PROPOSALS = 20;

export function GovernancePage() {
  const { address, isConnected } = useAccount();
  const { data: owners, refetch: refetchOwners } = useMultisigOwners();
  const { data: required } = useMultisigRequired();
  const { toasts, success, error, removeToast } = useToast();
  const [proposeOpen, setProposeOpen] = useState(false);

  const ownerList = (owners as string[] | undefined) ?? [];
  const isInitialized = ownerList.length > 0;
  const isOwner = ownerList.some((o) => o.toLowerCase() === address?.toLowerCase());

  const proposalIds = Array.from({ length: MAX_PROPOSALS }, (_, i) => BigInt(MAX_PROPOSALS - 1 - i));

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-slate-500">Connect your wallet to view governance.</p>
        <w3m-button />
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
              onClick={() => setProposeOpen(true)}>
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
              onSuccess={(msg) => success("Done!", msg)}
              onError={(msg) => error("Error", msg)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Recent Proposals</h2>
              {isOwner && (
                <Button variant="secondary" size="sm" icon={<Shield size={13} />}
                  onClick={() => setProposeOpen(true)}>
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

      <ProposeModal isOpen={proposeOpen} onClose={() => setProposeOpen(false)}
        onSuccess={(msg) => success("Proposed!", msg)}
        onError={(msg) => error("Error", msg)} />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}