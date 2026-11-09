"use client";

import Image from "next/image";
import { useState } from "react";
import { getCharityLogoSrc, isRemoteLogoUrl } from "@/lib/charity-logo";

interface CharityLogoProps {
  charityId?: string | null;
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { container: "w-8 h-8", text: "text-xs", image: 32 },
  md: { container: "w-12 h-12", text: "text-sm", image: 48 },
  lg: { container: "w-16 h-16", text: "text-xl", image: 64 },
  xl: { container: "w-20 h-20", text: "text-2xl", image: 80 },
};

export default function CharityLogo({
  charityId,
  name,
  logoUrl,
  size = "md",
  className = "",
}: CharityLogoProps) {
  const { container, text, image } = sizeMap[size];
  const resolvedLogoSrc = getCharityLogoSrc({ charityId, logoUrl });
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Get initials from charity name (first letter of first two words)
  const getInitials = (name: string): string => {
    const words = name.split(" ").filter((word) => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.slice(0, 2).toUpperCase() || "??";
  };

  if (resolvedLogoSrc && resolvedLogoSrc !== failedSrc) {
    const handleError = () => setFailedSrc(resolvedLogoSrc);

    if (isRemoteLogoUrl(resolvedLogoSrc)) {
      return (
        <div className={`relative ${container} ${className}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedLogoSrc}
            alt={`${name} logo`}
            width={image}
            height={image}
            className="h-full w-full rounded-lg object-cover"
            onError={handleError}
          />
        </div>
      );
    }

    return (
      <div className={`relative ${container} ${className}`}>
        <Image
          src={resolvedLogoSrc}
          alt={`${name} logo`}
          width={image}
          height={image}
          className="rounded-lg object-cover"
          onError={handleError}
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${container} ${className} rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center font-bold ${text} text-primary`}
    >
      {getInitials(name)}
    </div>
  );
}
