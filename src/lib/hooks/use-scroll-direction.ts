"use client";

import { useEffect, useState, useRef, type RefObject } from "react";

export function useScrollDirection(scrollRef: RefObject<HTMLElement | null>): "up" | "down" {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      const st = el!.scrollTop;
      const threshold = 10;
      if (Math.abs(st - lastScrollTop.current) < threshold) return;
      setDirection(st > lastScrollTop.current ? "down" : "up");
      lastScrollTop.current = st;
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef]);

  return direction;
}
