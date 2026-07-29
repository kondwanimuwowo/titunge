"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPathname = useRef(pathname);

  // Reset on route change complete
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsNavigating(false);
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 200);
      prevPathname.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Animate progress bar while navigating
  useEffect(() => {
    if (!isNavigating) return;

    setProgress(20);
    const t1 = setTimeout(() => setProgress(45), 100);
    const t2 = setTimeout(() => setProgress(65), 300);
    const t3 = setTimeout(() => setProgress(80), 800);
    const t4 = setTimeout(() => setProgress(90), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isNavigating]);

  // Intercept link clicks to trigger progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (anchor.getAttribute("target") === "_blank") return;

      // Don't trigger if same page
      const url = new URL(href, window.location.origin);
      if (url.pathname === pathname) return;

      setIsNavigating(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]">
      <div
        className={`h-full bg-primary transition-all ease-out ${isNavigating ? 'duration-300' : 'duration-200'}`}
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
