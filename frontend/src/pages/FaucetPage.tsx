import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from "wagmi";
import { AppKitButton } from "@reown/appkit/react";
import { Droplets, Clock, Coins, Wallet, RefreshCw, CheckCircle, AlertCircle, Zap, ExternalLink, CirclePlus } from "lucide-react";
import { PageHeader } from "../components/layout/Layout";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/index";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { DIAMOND_ADDRESS, FAUCET_ABI, ERC20_ABI } from "../config/contracts";
import { formatToken } from "../utils/formatters";

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useFaucetInfo() {
  return useReadContract({
    address: DIAMOND_ADDRESS, abi: FAUCET_ABI, functionName: "getFaucetInfo",
    query: { refetchInterval: 30_000 },
  });
}

/** Same balance the faucet uses: PRM held by the diamond (`claimFaucet` transfers from `address(this)`). Works even when FaucetFacet is not installed yet. */
function useDiamondPrmPool() {
  return useReadContract({
    address: DIAMOND_ADDRESS,
    abi: ERC20_ABI,
    functionName: "erc20BalanceOf",
    args: [DIAMOND_ADDRESS],
    query: { refetchInterval: 30_000 },
  });
}

const DEFAULT_CLAIM = 100n * 10n ** 18n;
const DEFAULT_COOLDOWN = 43200n;

function useCanClaim(user?: string) {
  return useReadContract({
    address: DIAMOND_ADDRESS, abi: FAUCET_ABI, functionName: "canClaim",
    args: user ? [user as `0x${string}`] : undefined,
    query: { enabled: !!user, refetchInterval: 15_000 },
  });
}

function useNextClaimTime(user?: string) {
  return useReadContract({
    address: DIAMOND_ADDRESS, abi: FAUCET_ABI, functionName: "getNextClaimTime",
    args: user ? [user as `0x${string}`] : undefined,
    query: { enabled: !!user, refetchInterval: 15_000 },
  });
}

function useTokenBalance(user?: string) {
  return useReadContract({
    address: DIAMOND_ADDRESS, abi: ERC20_ABI, functionName: "erc20BalanceOf",
    args: user ? [user as `0x${string}`] : undefined,
    query: { enabled: !!user, refetchInterval: 30_000 },
  });
}

function useTokenSymbol() {
  return useReadContract({
    address: DIAMOND_ADDRESS,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { refetchInterval: 60_000 },
  });
}

function useTokenDecimals() {
  return useReadContract({
    address: DIAMOND_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { refetchInterval: 60_000 },
  });
}

const HSK_FAUCET_URL = "https://faucet.hsk.xyz/faucet";

function useClaimFaucet() {
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });
  const claim = () =>
    writeContract({ address: DIAMOND_ADDRESS, abi: FAUCET_ABI, functionName: "claimFaucet" });
  return {
    claim,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
    receiptError,
    isReceiptError,
    reset,
    hash,
  };
}

// ─── Countdown Timer ──────────────────────────────────────────────────────────

function useCountdown(targetTimestamp?: bigint) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!targetTimestamp || targetTimestamp === 0n) { setSecondsLeft(0); return; }
    const tick = () => {
      const diff = Number(targetTimestamp) - Math.floor(Date.now() / 1000);
      setSecondsLeft(Math.max(0, diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTimestamp]);

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return { secondsLeft, h, m, s };
}

function pad(n: number) { return String(n).padStart(2, "0"); }

// ─── Faucet Page ──────────────────────────────────────────────────────────────

export function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { toasts, success, error, removeToast } = useToast();
  const [addTokenLoading, setAddTokenLoading] = useState(false);

  const { data: faucetInfo, refetch: refetchInfo, isError: faucetConfigError } = useFaucetInfo();
  const {
    data: diamondPool,
    refetch: refetchPool,
    isFetched: poolFetched,
    isPending: poolPending,
    isError: poolError,
  } = useDiamondPrmPool();
  const { data: canClaim, refetch: refetchClaim } = useCanClaim(address);
  const { data: nextClaimTime, refetch: refetchNext } = useNextClaimTime(address);
  const { data: balance, refetch: refetchBalance } = useTokenBalance(address);
  const { data: tokenSymbol } = useTokenSymbol();
  const { data: tokenDecimals } = useTokenDecimals();
  const {
    claim,
    isPending,
    isConfirming,
    isSuccess,
    writeError,
    receiptError,
    isReceiptError,
    reset,
    hash,
  } = useClaimFaucet();

  const refetchAll = () => {
    refetchInfo();
    refetchPool();
    refetchClaim();
    refetchNext();
    refetchBalance();
  };

  useEffect(() => {
    if (isSuccess) {
      success("Claimed!", `Tokens have been sent to your wallet.`);
      refetchAll();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (!writeError) return;
    error("Claim failed", (writeError as Error).message?.slice(0, 120) || "Wallet rejected or RPC error");
    reset();
  }, [writeError, reset]);

  useEffect(() => {
    if (!isReceiptError || !receiptError) return;
    error("Transaction failed", (receiptError as Error).message?.slice(0, 120) || "Revert or out of gas");
  }, [isReceiptError, receiptError, hash]);

  const claimAmount = faucetInfo ? (faucetInfo as [bigint, bigint, bigint])[0] : DEFAULT_CLAIM;
  const cooldownSecs = faucetInfo ? (faucetInfo as [bigint, bigint, bigint])[1] : DEFAULT_COOLDOWN;

  const faucetBalance = diamondPool ?? 0n;

  const cooldownHours = Number(cooldownSecs) / 3600;
  const { secondsLeft, h, m, s } = useCountdown(nextClaimTime as bigint | undefined);
  const isOnCooldown = !!nextClaimTime && (nextClaimTime as bigint) > 0n;
  const isEmpty = poolFetched && !poolError && faucetBalance === 0n;
  const facetMissing = faucetConfigError;

  const handleClaim = () => {
    try { claim(); }
    catch (e: any) { error("Claim failed", e?.message?.slice(0, 80) || "Unknown error"); }
  };

  const handleAddTokenToWallet = async () => {
    if (!isConnected || !walletClient) {
      error("Wallet", "Connect your wallet first.");
      return;
    }
    const sym = (typeof tokenSymbol === "string" && tokenSymbol ? tokenSymbol : "PRM").slice(0, 11);
    const dec =
      typeof tokenDecimals === "bigint"
        ? Number(tokenDecimals)
        : typeof tokenDecimals === "number"
          ? tokenDecimals
          : 18;
    setAddTokenLoading(true);
    try {
      await walletClient.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: DIAMOND_ADDRESS,
            symbol: sym,
            decimals: dec,
          },
        },
      });
      success("Token added", `${sym} uses the Prism diamond address — it should appear in your wallet list.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("reject") || msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("cancel")) {
        error("Add token", "Request cancelled in your wallet.");
      } else {
        error("Add token", msg.slice(0, 120) || "Your wallet may not support this action.");
      }
    } finally {
      setAddTokenLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Token Faucet"
        subtitle="Claim free PRM tokens every 12 hours — use them to buy NFTs on the marketplace"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<CirclePlus size={14} />}
              loading={addTokenLoading}
              disabled={!isConnected || addTokenLoading}
              title={!isConnected ? "Connect wallet to add PRM" : "Register PRM in MetaMask / your wallet (EIP-747)"}
              onClick={handleAddTokenToWallet}
            >
              Add PRM to wallet
            </Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={14} />} onClick={refetchAll}>
              Refresh
            </Button>
          </div>
        }
      />

      {facetMissing && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Faucet facet not on this diamond yet</p>
          <p className="text-amber-800/90 mt-1">
            Pool balance below is read from the diamond&apos;s PRM balance (your funding is there on-chain). Add{" "}
            <span className="font-mono text-xs">FaucetFacet</span> via <span className="font-mono text-xs">diamondCut</span>{" "}
            to enable <span className="font-mono text-xs">claimFaucet</span> — redeploy or upgrade the diamond, then refresh.
          </p>
        </div>
      )}

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Droplets size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Per Claim</p>
              <p className="text-lg font-bold text-slate-800">
                {formatToken(claimAmount)} <span className="text-sm font-medium text-violet-600">PRM</span>
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Cooldown</p>
              <p className="text-lg font-bold text-slate-800">
                {cooldownHours}h <span className="text-sm font-medium text-amber-600">per wallet</span>
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isEmpty ? "bg-rose-100" : "bg-emerald-100"}`}>
              <Coins size={18} className={isEmpty ? "text-rose-500" : "text-emerald-600"} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Faucet balance (diamond)</p>
              <p className="text-lg font-bold text-slate-800">
                {!poolFetched && poolPending ? "…" : poolError ? (
                  <span className="text-sm text-rose-500">Could not load</span>
                ) : (
                  <>
                    {formatToken(faucetBalance as bigint)}{" "}
                    <span className={`text-sm font-medium ${isEmpty ? "text-rose-500" : "text-emerald-600"}`}>PRM</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Main claim card ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card accent="violet">
          <div className="text-center py-4">
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              isEmpty ? "bg-slate-100" : isOnCooldown ? "bg-amber-100" : "bg-violet-100"
            }`}>
              {isEmpty
                ? <AlertCircle size={36} className="text-slate-400" />
                : isOnCooldown
                ? <Clock size={36} className="text-amber-500" />
                : <Zap size={36} className="text-violet-600" />}
            </div>

            {/* Status */}
            {isEmpty && !facetMissing && (
              <>
                <p className="text-xl font-bold text-slate-700 mb-1">Faucet Empty</p>
                <p className="text-sm text-slate-400 mb-6">The faucet is out of tokens. Signers can top it up via a governance proposal.</p>
              </>
            )}

            {isEmpty && facetMissing && (
              <>
                <p className="text-xl font-bold text-slate-700 mb-1">Pool is empty on-chain</p>
                <p className="text-sm text-slate-400 mb-6">Or the faucet facet isn&apos;t installed — see the notice above. If you already funded, check the diamond address in config matches the contract you minted to.</p>
              </>
            )}

            {!isEmpty && isOnCooldown && (
              <>
                <p className="text-xl font-bold text-slate-700 mb-1">Come back soon</p>
                <p className="text-sm text-slate-400 mb-4">Your next claim is available in:</p>
                {/* Countdown */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[{ v: h, l: "h" }, { v: m, l: "m" }, { v: s, l: "s" }].map(({ v, l }) => (
                    <div key={l} className="flex flex-col items-center">
                      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800 tabular-nums">{pad(v)}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1">{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!isEmpty && !isOnCooldown && (
              <>
                <p className="text-xl font-bold text-slate-800 mb-1">Ready to claim!</p>
                <p className="text-sm text-slate-400 mb-6">
                  You can claim <span className="font-semibold text-violet-600">{formatToken(claimAmount)} PRM</span> right now.
                </p>
              </>
            )}

            {!isConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">Connect your wallet to claim tokens</p>
                <AppKitButton />
              </div>
            ) : (
              <Button
                fullWidth
                variant={isEmpty || isOnCooldown ? "ghost" : "primary"}
                size="lg"
                loading={isPending || isConfirming}
                disabled={
                  facetMissing ||
                  isEmpty ||
                  isPending ||
                  isConfirming ||
                  (isConnected && canClaim !== true)
                }
                onClick={handleClaim}
                icon={<Droplets size={16} />}
              >
                {isPending ? "Confirm in wallet…"
                  : isConfirming ? "Claiming…"
                  : facetMissing ? "Install FaucetFacet first"
                  : isEmpty ? "Faucet empty"
                  : isOnCooldown ? "Cooldown active"
                  : `Claim ${formatToken(claimAmount)} PRM`}
              </Button>
            )}
          </div>
        </Card>

        {/* ── Wallet info ──────────────────────────────────────── */}
        <div className="space-y-4">
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Your Wallet</CardTitle>
                {canClaim && !isEmpty && <Badge color="emerald" dot>Ready</Badge>}
                {isOnCooldown && <Badge color="amber">Cooldown</Badge>}
              </CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Wallet size={14} className="text-slate-400" /> PRM Balance
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {balance !== undefined ? formatToken(balance as bigint) : "—"} PRM
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={14} className="text-slate-400" /> Next Claim
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {!nextClaimTime || (nextClaimTime as bigint) === 0n
                      ? "Now"
                      : secondsLeft > 0
                      ? `${h}h ${m}m ${pad(s)}s`
                      : "Now"}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle size={14} className="text-slate-400" /> Status
                  </div>
                  <Badge color={canClaim && !isEmpty ? "emerald" : "amber"} size="sm">
                    {isEmpty ? "Faucet empty" : canClaim ? "Can claim" : "On cooldown"}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Need gas (HSK)?</CardTitle>
            </CardHeader>
            <p className="text-sm text-slate-600 mb-3">
              HashKey Chain testnet gas is paid in HSK. Use the official faucet to fund your wallet for transactions.
            </p>
            <a
              href={HSK_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              <ExternalLink size={16} />
              Open HashKey HSK Faucet
            </a>
            <p className="text-xs text-slate-400 mt-2">
              Official testnet faucet (typically once per 24h per address). See{" "}
              <a href={HSK_FAUCET_URL} className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">
                faucet.hsk.xyz
              </a>
              .
            </p>
          </Card>

          <Card>
            <CardHeader><CardTitle>How it works</CardTitle></CardHeader>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">1</span>
                </div>
                <p>Connect your wallet and click <strong>Claim</strong>.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">2</span>
                </div>
                <p>Receive <strong>{formatToken(claimAmount)} PRM</strong> tokens instantly on {cooldownHours}h cooldown.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-violet-700">3</span>
                </div>
                <p>Use PRM tokens to <strong>buy NFTs</strong> from the marketplace.</p>
              </div>
              <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-500">
                The faucet balance is funded by governance proposals. Signers mint tokens into the contract, which then distribute them here.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
