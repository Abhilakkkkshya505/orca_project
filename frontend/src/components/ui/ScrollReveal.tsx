import React, { useEffect, useRef, useState } from "react";

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside" | "li" | "ul" | "ol" | "form" | "header" | "footer";
  children: React.ReactNode;
  delay?: number; // In milliseconds
  yOffset?: number; // In pixels, default 24
  duration?: number; // In milliseconds, default 550
  threshold?: number; // Intersection threshold, default 0.1
  rootMargin?: string; // Intersection rootMargin, default "0px 0px -40px 0px"
  once?: boolean; // Default true
  initialVisible?: boolean; // Default false (true for hero sections)
  className?: string;
}

/**
 * ScrollReveal Component
 * Hardware-accelerated, once-only viewport reveal animation.
 * Respects prefers-reduced-motion, frees will-change on completion, and avoids mobile layout shifts.
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  as = "div",
  children,
  delay = 0,
  yOffset = 24,
  duration = 550,
  threshold = 0.1,
  rootMargin = "0px 0px -40px 0px",
  once = true,
  initialVisible = false,
  className = "",
  style,
  ...rest
}) => {
  const Component = as as any;
  const domRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isTransitionDone, setIsTransitionDone] = useState(initialVisible);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user accessibility preference for reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPrefersReducedMotion(true);
      setIsVisible(true);
      setIsTransitionDone(true);
      return;
    }

    if (initialVisible) {
      setIsVisible(true);
      setIsTransitionDone(true);
      return;
    }

    const node = domRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      setIsTransitionDone(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) {
              observer.unobserve(entry.target);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [once, threshold, rootMargin, initialVisible]);

  // Clean up willChange after the animation finishes to free compositor memory
  useEffect(() => {
    if (isVisible && !isTransitionDone && !prefersReducedMotion) {
      const timer = window.setTimeout(() => {
        setIsTransitionDone(true);
      }, duration + delay + 50);
      return () => window.clearTimeout(timer);
    }
  }, [isVisible, isTransitionDone, prefersReducedMotion, duration, delay]);

  const transitionStyle: React.CSSProperties = prefersReducedMotion
    ? { ...style }
    : {
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? "translate3d(0, 0, 0)"
          : `translate3d(0, ${yOffset}px, 0)`,
        transitionProperty: "opacity, transform",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        willChange: isTransitionDone ? "auto" : "opacity, transform",
      };

  return (
    <Component
      ref={domRef}
      className={className}
      style={transitionStyle}
      {...rest}
    >
      {children}
    </Component>
  );
};

export interface ScrollRevealGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  staggerDelay?: number; // In milliseconds, default 80
  baseDelay?: number; // In milliseconds, default 0
  yOffset?: number;
  duration?: number;
  className?: string;
  as?: "div" | "ul" | "ol" | "section";
}

/**
 * ScrollRevealGroup Component
 * Automatically injects staggered delays into immediate children when wrapped in ScrollReveal.
 */
export const ScrollRevealGroup: React.FC<ScrollRevealGroupProps> = ({
  children,
  staggerDelay = 80,
  baseDelay = 0,
  yOffset = 24,
  duration = 550,
  className = "",
  as = "div",
  ...rest
}) => {
  const Component = as as any;

  return (
    <Component className={className} {...rest}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <ScrollReveal
            delay={baseDelay + index * staggerDelay}
            yOffset={yOffset}
            duration={duration}
          >
            {child}
          </ScrollReveal>
        );
      })}
    </Component>
  );
};

export default ScrollReveal;
