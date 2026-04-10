import { AppKitButton } from "@reown/appkit/react";
import { useAccount, useBalance } from "wagmi";
import { hashkey } from "../../config/chains";
import { formatEth } from "../../utils/formatters";

export function WalletStatus() {
  const { address, isConnected } = useAccount();

  // IMPORTANT: force the connected network's native balance (HSK on chainId 133),
  // instead of defaulting to mainnet / "ETH".
  const { data: hskBalance } = useBalance({
    address,
    chainId: hashkey.id,
    query: {
      enabled: isConnected && !!address,
      staleTime: 10_000,
      gcTime: 60_000,
      refetchInterval: 5_000,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  });

  return (
    <div className="flex items-center gap-2">
      <AppKitButton />
      {isConnected && (
        <div
          className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md border border-slate-200
            rounded-xl px-3 py-1.5 shadow-sm"
          title="Native balance on HashKey Chain (HSK)"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-sm font-semibold text-slate-700">
            {hskBalance ? `${formatEth(hskBalance.value, 2)} HSK` : "—"}
          </span>
        </div>
      )}
    </div>
  );
}

