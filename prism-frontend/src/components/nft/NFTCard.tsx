import { useState } from "react";
import { ExternalLink, Shield, Swords, Wand2, Loader2 } from "lucide-react";
import { Badge } from "../ui/index";
import { useTokenData, useTokenURI, useOwnerOf } from "../../hooks/useERC721";
import { useStakeInfo } from "../../hooks/useStaking";
import { useListing } from "../../hooks/useMarketplace";
import { useBorrowInfo } from "../../hooks/useBorrow";
import { formatToken, getTraitType, shortenAddress, addressUrl } from "../../utils/formatters";
import { Button } from "../ui/Button";

interface NFTCardProps {
  tokenId: bigint;
  showOwner?: boolean;
  actionLabel?: string;
  onAction?: (tokenId: bigint) => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: (tokenId: bigint) => void;
  selected?: boolean;
  onClick?: (tokenId: bigint) => void;
}

function TraitIcon({ mage, attack, defense }: { mage: boolean; attack: number; defense: number }) {
  const trait = getTraitType(mage, attack, defense);
  if (trait === "Mage") return <Wand2 size={12} />;
  if (trait === "Attack") return <Swords size={12} />;
  return <Shield size={12} />;
}

function traitBadgeColor(mage: boolean, attack: number, defense: number): "violet" | "rose" | "sky" {
  const t = getTraitType(mage, attack, defense);
  if (t === "Mage") return "violet";
  if (t === "Attack") return "rose";
  return "sky";
}

// Parse and render on-chain base64 SVG tokenURI
function NFTImage({ tokenId }: { tokenId: bigint }) {
  const { data: uri, isLoading } = useTokenURI(tokenId);
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-violet-50 to-sky-50 rounded-xl flex items-center justify-center">
        <Loader2 size={24} className="text-violet-300 animate-spin" />
      </div>
    );
  }

  if (!uri || imgError) {
    return (
      <div className="w-full aspect-square bg-gradient-to-br from-violet-100 to-sky-100 rounded-xl flex items-center justify-center">
        <span className="text-2xl font-bold text-violet-300 font-display">#{tokenId.toString()}</span>
      </div>
    );
  }

  // tokenURI is a data:application/json;base64,... — parse to get image
  let imageUrl = "";
  try {
    if (uri.startsWith("data:application/json;base64,")) {
      const json = JSON.parse(atob(uri.split(",")[1]));
      imageUrl = json.image || "";
    } else if (uri.startsWith("data:image/")) {
      imageUrl = uri;
    }
  } catch {
    imageUrl = uri;
  }

  return (
    <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-50">
      <img
        src={imageUrl}
        alt={`Prism NFT #${tokenId}`}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

function StatusBadge({ tokenId }: { tokenId: bigint }) {
  const { data: stake } = useStakeInfo(tokenId);
  const { data: borrow } = useBorrowInfo(tokenId);
  const { data: listing } = useListing(tokenId);

  const isStaked = stake && stake[0] !== "0x0000000000000000000000000000000000000000";
  const isBorrowed = borrow && borrow[0] !== "0x0000000000000000000000000000000000000000";
  const isListed = listing && listing[2];

  if (isBorrowed) return <Badge color="amber" dot>Borrowed</Badge>;
  if (isStaked) return <Badge color="emerald" dot>Staked</Badge>;
  if (isListed) return <Badge color="sky" dot>Listed</Badge>;
  return null;
}

export function NFTCard({
  tokenId,
  showOwner = false,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  selected = false,
  onClick,
}: NFTCardProps) {
  const { data: tokenData } = useTokenData(tokenId);
  const { data: owner } = useOwnerOf(tokenId);
  const { data: listing } = useListing(tokenId);

  const attack = tokenData?.attack ?? 0;
  const defense = tokenData?.defense ?? 0;
  const mage = tokenData?.mage ?? false;
  const trait = getTraitType(mage, attack, defense);
  const price = listing?.[1] ?? 0n;
  const isListed = listing?.[2] ?? false;

  return (
    <div
      onClick={() => onClick?.(tokenId)}
      className={[
        "bg-white rounded-2xl border overflow-hidden transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-0.5",
        selected
          ? "border-violet-400 ring-2 ring-violet-200 shadow-md"
          : "border-slate-100 shadow-sm",
        onClick ? "cursor-pointer" : "",
      ].join(" ")}
    >
      {/* Image */}
      <div className="p-3 pb-0">
        <div className="relative">
          <NFTImage tokenId={tokenId} />
          <div className="absolute top-2 left-2">
            <StatusBadge tokenId={tokenId} />
          </div>
          <div className="absolute top-2 right-2">
            <Badge color={traitBadgeColor(mage, attack, defense)} size="sm">
              <TraitIcon mage={mage} attack={attack} defense={defense} />
              {trait}
            </Badge>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold text-slate-800 font-display">
            Prism #{tokenId.toString()}
          </p>
          {isListed && price > 0n && (
            <p className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-lg">
              {formatToken(price)} PRM
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-rose-50 rounded-lg p-1.5 text-center">
            <p className="text-xs text-rose-400 font-medium">ATK</p>
            <p className="text-sm font-bold text-rose-600">{attack}</p>
          </div>
          <div className="flex-1 bg-sky-50 rounded-lg p-1.5 text-center">
            <p className="text-xs text-sky-400 font-medium">DEF</p>
            <p className="text-sm font-bold text-sky-600">{defense}</p>
          </div>
          <div className="flex-1 bg-violet-50 rounded-lg p-1.5 text-center">
            <p className="text-xs text-violet-400 font-medium">TYPE</p>
            <p className="text-xs font-bold text-violet-600 truncate">{mage ? "Mage" : "Fighter"}</p>
          </div>
        </div>

        {/* Owner */}
        {showOwner && owner && (
          <a
            href={addressUrl(owner)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-600 transition-colors mb-2"
          >
            <ExternalLink size={10} />
            {shortenAddress(owner)}
          </a>
        )}

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex gap-2">
            {actionLabel && onAction && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(tokenId);
                }}
              >
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={(e) => {
                  e.stopPropagation();
                  onSecondaryAction(tokenId);
                }}
              >
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
