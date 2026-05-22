"use client";

import { useEffect, useRef, ReactNode, ElementType } from "react";

interface Props {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: ElementType;
}

export default function ScrollReveal({ children, delay = 0, className = "", as: Tag = "div" }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          obs.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delayClass = delay > 0 ? ` reveal-delay-${delay}` : "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AnyTag = Tag as any;
  return (
    <AnyTag ref={ref} className={`reveal${delayClass}${className ? ` ${className}` : ""}`}>
      {children}
    </AnyTag>
  );
}
