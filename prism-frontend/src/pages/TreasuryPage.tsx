import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Vault, ArrowUpRight, Coins } from "lucide-react";
import { AppKitButton } from "@reown/appkit/react";
import { parseEther, parseUnits } from "viem";
import { PageHeader } from "../components/layout/Layout";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import { StatCard } from "../components/ui/index";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/index";
import { Badge } from "../components/ui/index";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useWithdrawTreasuryERC20, useWithdrawTreasuryETH } from "../hooks/useTreasury";
import { useTokenBalance } from "../hooks/useERC20";
import { useMultisigOwners } from "../hooks/useMultisig";
import { DIAMOND_ADDRESS } from "../config/contracts";
import { formatToken, formatEth } from "../utils/formatters";

export function TreasuryPage() {
  const { address, isConnected } = useAccount();
  const { data: treasuryEthBalance } = useBalance({ address: DIAMOND_ADDRESS });
  const { data: treasuryERC20Balance } = useTokenBalance(DIAMOND_ADDRESS);
  const { data: multisigOwners } = useMultisigOwners();
  const { toasts, success, error, removeToast } = useToast();

  const { withdraw: withdrawERC20, isPending: withdrawingERC20 } = useWithdrawTreasuryERC20();
  const { withdraw: withdrawETH, isPending: withdrawingETH } = useWithdrawTreasuryETH();

  const [erc20To, setErc20To] = useState("");
  const [erc20Amount, setErc20Amount] = useState("");
  const [ethTo, setEthTo] = useState("");
  const [ethAmount, setEthAmount] = useState("");

  const isOwner = multisigOwners
    ? (multisigOwners as string[]).some(o => o.toLowerCase() === address?.toLowerCase())
    : false;

  const handleWithdrawERC20 = async () => {
    try {
      await withdrawERC20(erc20To as `0x${string}`, parseUnits(erc20Amount, 18));
      success("Withdrawn", `${erc20Amount} PRM sent to ${erc20To.slice(0, 8)}...`);
      setErc20Amount(""); setErc20To("");
    } catch (e: any) {
      error("Error", e?.message?.slice(0, 80));
    }
  };

  const handleWithdrawETH = async () => {
    try {
      await withdrawETH(ethTo as `0x${string}`, parseEther(ethAmount));
      success("Withdrawn", `${ethAmount} HSK sent to ${ethTo.slice(0, 8)}...`);
      setEthAmount(""); setEthTo("");
    } catch (e: any) {
      error("Error", e?.message?.slice(0, 80));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <p className="text-slate-500">Connect your wallet to view the treasury.</p>
        <AppKitButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treasury"
        subtitle="Protocol-held funds — withdrawals require multisig authorization"
        action={
          isOwner ? (
            <Badge color="emerald" dot>Signer Access</Badge>
          ) : (
            <Badge color="slate">Read Only</Badge>
          )
        }
      />

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Treasury ETH Balance"
          value={treasuryEthBalance ? `${formatEth(treasuryEthBalance.value)} HSK` : "—"}
          sub="Native token holdings"
          icon={<Vault size={18} />}
          color="sky"
        />
        <StatCard
          label="Treasury PRM Balance"
          value={treasuryERC20Balance !== undefined ? `${formatToken(treasuryERC20Balance as bigint, 18, 2)} PRM` : "—"}
          sub="Protocol token holdings"
          icon={<Coins size={18} />}
          color="violet"
        />
      </div>

      {/* Revenue sources explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Sources</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Platform Fee", desc: "% of every marketplace sale (burned from ERC20)", color: "amber" },
            { label: "Borrow Fee Cut", desc: "20% of every borrow fee paid to the protocol", color: "violet" },
            { label: "Liquidation Cut", desc: "20% of ETH collateral from liquidated positions", color: "rose" },
          ].map(({ label, desc, color }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3`}>
              <p className={`text-sm font-semibold text-${color}-700 mb-1`}>{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Withdrawal forms — only for multisig owners */}
      {isOwner ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ERC20 Withdrawal */}
          <Card accent="violet">
            <CardHeader>
              <CardTitle>Withdraw PRM</CardTitle>
              <ArrowUpRight size={16} className="text-violet-400" />
            </CardHeader>
            <div className="space-y-3">
              <Input
                label="Recipient Address"
                placeholder="0x..."
                value={erc20To}
                onChange={(e) => setErc20To(e.target.value)}
              />
              <Input
                label="Amount"
                type="number" min="0" step="any"
                placeholder="0.00"
                value={erc20Amount}
                onChange={(e) => setErc20Amount(e.target.value)}
                suffix="PRM"
              />
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                ⚠ This is a direct treasury withdrawal. Ensure it is authorized by multisig consensus before executing.
              </div>
              <Button
                fullWidth variant="primary" loading={withdrawingERC20}
                disabled={!erc20To || !erc20Amount || withdrawingERC20}
                onClick={handleWithdrawERC20}
                icon={<ArrowUpRight size={14} />}
              >
                Withdraw PRM
              </Button>
            </div>
          </Card>

          {/* ETH Withdrawal */}
          <Card accent="sky">
            <CardHeader>
              <CardTitle>Withdraw HSK</CardTitle>
              <ArrowUpRight size={16} className="text-sky-400" />
            </CardHeader>
            <div className="space-y-3">
              <Input
                label="Recipient Address"
                placeholder="0x..."
                value={ethTo}
                onChange={(e) => setEthTo(e.target.value)}
              />
              <Input
                label="Amount"
                type="number" min="0" step="any"
                placeholder="0.00"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                suffix="HSK"
              />
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                ⚠ This is a direct treasury withdrawal. Ensure it is authorized by multisig consensus before executing.
              </div>
              <Button
                fullWidth variant="primary" loading={withdrawingETH}
                disabled={!ethTo || !ethAmount || withdrawingETH}
                onClick={handleWithdrawETH}
                icon={<ArrowUpRight size={14} />}
              >
                Withdraw HSK
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-8">
          <Vault size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 text-sm">Only multisig signers can initiate treasury withdrawals.</p>
          <p className="text-slate-400 text-xs mt-1">Connect with a signer wallet to access withdrawal controls.</p>
        </Card>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
