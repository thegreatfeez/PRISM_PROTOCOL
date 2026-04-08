import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMultisigOwners } from "./useMultisig";
import { useReadContract } from "wagmi";
import { DIAMOND_ADDRESS, OWNERSHIP_ABI } from "../config/contracts";

export type Role = "signer" | "user" | "guest";

/**
 * Determines the role of the connected wallet:
 *
 * "signer" → address is in the multisig owner list OR is the contract owner
 *            (the deployed address is the contract owner by default via OwnershipFacet,
 *             so it always gets signer access even before initMultisig is called)
 *
 * "user"   → connected but not a signer
 * "guest"  → not connected
 */
export function useRole(): {
  role: Role;
  isSigner: boolean;
  isUser: boolean;
  isGuest: boolean;
  isLoading: boolean;
  address: string | undefined;
} {
  const { address, isConnected } = useAccount();
  const configuredSigner = import.meta.env.VITE_DEFAULT_SIGNER_ADDRESS?.toLowerCase();
  const [lastResolvedSigner, setLastResolvedSigner] = useState<{
    address: string;
    isSigner: boolean;
  } | null>(null);

  const { data: owners, isLoading: loadingOwners } = useMultisigOwners();

  // Also check the contract owner (OwnershipFacet) — the deployer address
  // is always the contract owner and should have signer-level access
  const { data: contractOwner, isLoading: loadingOwner } = useReadContract({
    address: DIAMOND_ADDRESS,
    abi: OWNERSHIP_ABI,
    functionName: "owner",
    query: {
      enabled: isConnected && !!address,
      staleTime: 30_000,
      gcTime: 300_000,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  });

  useEffect(() => {
    if (!isConnected || !address) {
      setLastResolvedSigner(null);
    }
  }, [isConnected, address]);

  const ownerList = (owners as string[] | undefined) ?? [];
  const addrLower = address?.toLowerCase();

  const isMultisigOwner = !!addrLower && ownerList.some((o) => o.toLowerCase() === addrLower);

  const isContractOwner =
    !!addrLower &&
    contractOwner !== undefined &&
    (contractOwner as string).toLowerCase() === addrLower;

  const isConfiguredSigner =
    !!addrLower && !!configuredSigner && configuredSigner === addrLower;

  const resolvedNow = isConfiguredSigner || owners !== undefined || contractOwner !== undefined;
  const resolvedSignerNow = isMultisigOwner || isContractOwner || isConfiguredSigner;

  // IMPORTANT: This effect must always be called (no conditional early returns),
  // otherwise React can crash when connection state changes.
  useEffect(() => {
    if (!isConnected || !address) return;
    if (!resolvedNow) return;

    setLastResolvedSigner((prev) => {
      if (prev?.address === address && prev.isSigner === resolvedSignerNow) return prev;
      return { address, isSigner: resolvedSignerNow };
    });
  }, [isConnected, resolvedNow, resolvedSignerNow, address]);

  const hasCachedForAddress = !!address && lastResolvedSigner?.address === address;
  const isSigner = isConnected && address
    ? resolvedNow
      ? resolvedSignerNow
      : hasCachedForAddress
        ? lastResolvedSigner!.isSigner
        : false
    : false;

  const waitingOwners = isConnected && loadingOwners && owners === undefined;
  const waitingOwner = isConnected && loadingOwner && contractOwner === undefined;
  const isLoading = isConnected && !!address && !hasCachedForAddress && !resolvedNow && (waitingOwners || waitingOwner);
  const role: Role = !isConnected || !address ? "guest" : isSigner ? "signer" : "user";

  return {
    role,
    isSigner,
    isUser: !isSigner,
    isGuest: role === "guest",
    isLoading,
    address: isConnected ? address : undefined,
  };
}