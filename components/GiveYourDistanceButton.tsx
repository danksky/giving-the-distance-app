"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface GiveYourDistanceButtonProps {
  charityId: string;
  isAuthenticated: boolean;
  isSelected?: boolean;
  className?: string;
  loginPath?: string;
  label?: string;
  onSelected?: (charityId: string) => void;
}

export default function GiveYourDistanceButton({
  charityId,
  isAuthenticated,
  isSelected = false,
  className = "btn btn-outline btn-primary btn-sm",
  loginPath = "/",
  label = "Give Your Distance",
  onSelected,
}: GiveYourDistanceButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSelected, setHasSelected] = useState(isSelected);

  useEffect(() => {
    setHasSelected(isSelected);
  }, [isSelected]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(loginPath);
      return;
    }

    if (hasSelected) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user/charity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ charityId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update charity selection");
      }

      setHasSelected(true);
      onSelected?.(charityId);
      router.refresh();
    } catch (error) {
      console.error("Error selecting charity:", error);
      alert("Failed to update charity selection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSelected) {
    return (
      <button className="btn btn-success btn-sm gap-1.5" disabled>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Selected
      </button>
    );
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        label
      )}
    </button>
  );
}
