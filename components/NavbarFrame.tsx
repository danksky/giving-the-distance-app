"use client";

import { useEffect, useState } from "react";

export default function NavbarFrame({
  children,
  sticky = true,
}: {
  children: React.ReactNode;
  sticky?: boolean;
}) {
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    if (!sticky) {
      return;
    }

    const updateNavbarState = () => {
      setIsCondensed(window.scrollY > 12);
    };

    updateNavbarState();
    window.addEventListener("scroll", updateNavbarState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateNavbarState);
    };
  }, [sticky]);

  return (
    <div
      className={`navbar navbar-shell ${
        sticky
          ? "sticky top-0 z-50 border-b border-black/5 !bg-white/70 shadow-[0_10px_30px_rgba(17,24,39,0.08)] backdrop-blur-md supports-[backdrop-filter]:!bg-white/55"
          : "bg-base-100"
      } ${isCondensed ? "navbar-condensed" : ""}`}
    >
      {children}
    </div>
  );
}
