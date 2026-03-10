"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin animated progress bar at the top of the viewport.
 * Shows during route transitions to give instant visual feedback.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);
  }, []);

  useEffect(() => {
    reset();
  }, [pathname, searchParams, reset]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank") return;

      // Starting navigation — show progress
      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
      setVisible(true);
      setProgress(15);

      // Trickle up slowly
      intervalRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            clearInterval(intervalRef.current);
            return p;
          }
          return p + (90 - p) * 0.1;
        });
      }, 200);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [reset]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ opacity: visible || progress === 100 ? 1 : 0 }}
    >
      <div
        className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)] transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
