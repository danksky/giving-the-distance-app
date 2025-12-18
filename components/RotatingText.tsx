"use client";

import { useEffect, useState } from "react";

const messages = [
  "Hey there, athlete… way to go the distance for what you believe in.",
  "Calling all donors… show your neighbors that you give a foot!",
];

export default function RotatingText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after 4 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsVisible(false);
    }, 4000);

    // Change text and fade in after 5 seconds (1 second fade out duration)
    const changeTextTimer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
      setIsVisible(true);
    }, 5000);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(changeTextTimer);
    };
  }, [currentIndex]);

  return (
    <div className="h-32 flex items-center justify-center px-4">
      <p
        className={`text-xl transition-opacity duration-1000 absolute ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {messages[currentIndex]}
      </p>
    </div>
  );
}
