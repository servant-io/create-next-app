"use client";

import Confetti from "react-confetti";
import { useEffect, useState } from "react";

const CONFETTI_DURATION_MS = 4000;
const CONFETTI_PIECES = 160;

export function CelebrationConfetti() {
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionMedia.matches) return;

    const updateSize = () =>
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });

    updateSize();
    setIsActive(true);
    window.addEventListener("resize", updateSize);

    const timeoutId = window.setTimeout(
      () => setIsActive(false),
      CONFETTI_DURATION_MS,
    );

    return () => {
      window.removeEventListener("resize", updateSize);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!isActive || viewportSize.width === 0 || viewportSize.height === 0) {
    return null;
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50">
      <Confetti
        width={viewportSize.width}
        height={viewportSize.height}
        numberOfPieces={CONFETTI_PIECES}
        recycle={false}
      />
    </div>
  );
}
