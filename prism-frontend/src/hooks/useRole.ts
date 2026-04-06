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

  const { data: owners, isLoading: loadingOwners } = useMultisigOwners();

  // Also check the contract owner (OwnershipFacet) — the deployer address
  // is always the contract owner and should have signer-level access
  const { data: contractOwner, isLoading: loadingOwner } = useReadContract({
    address: DIAMOND_ADDRESS,
    abi: OWNERSHIP_ABI,
    functionName: "owner",
    query: { enabled: isConnected && !!address },
  });

  const isLoading = loadingOwners || loadingOwner;

  if (!isConnected || !address) {
    return {
      role: "guest",
      isSigner: false,
      isUser: false,
      isGuest: true,
      isLoading,
      address: undefined,
    };
  }

  const ownerList = (owners as string[] | undefined) ?? [];

  const isMultisigOwner = ownerList.some(
    (o) => o.toLowerCase() === address.toLowerCase()
  );

  const isContractOwner =
    contractOwner !== undefined &&
    (contractOwner as string).toLowerCase() === address.toLowerCase();

  const isSigner = isMultisigOwner || isContractOwner;
  const role: Role = isSigner ? "signer" : "user";

  return {
    role,
    isSigner,
    isUser: !isSigner,
    isGuest: false,
    isLoading,
    address,
  };
}