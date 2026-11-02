import { useEffect, useRef, type CSSProperties, type ReactElement } from "react";
import { cn } from "../lib/utils.js";

export type AtmosphereDensity = "zen" | "subtle" | "stellar" | "disabled";

export interface AtmosphereParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

export interface AmbientAtmosphereProps {
  /** Visual particle density preset. Defaults to "subtle". */
  density?: AtmosphereDensity;
  /** Custom particle count override (clamped between 10 and 120). */
  particleCount?: number;
  /** Whether mouse movements introduce gentle particle drift deflection. Default: false. */
  interactive?: boolean;
  /** Speed multiplier for particle motion (0.1 to 2.0). Default: 1.0. */
  speedMultiplier?: number;
  /** Optional class name merged via `cn(...)`. */
  className?: string;
  /** Optional inline styles. Must strictly conform to token references. */
  style?: CSSProperties;
}

const DENSITY_COUNTS: Record<AtmosphereDensity, number> = {
  zen: 25,
  subtle: 50,
  stellar: 90,
  disabled: 0,
};

/**
 * Universal Ambient Atmosphere Canvas Provider (Track 11).
 * Renders subdued, reverent cosmic stardust / nebula motes in 60 FPS.
 * Respects `prefers-reduced-motion` and pauses when tab visibility is hidden.
 */
export function AmbientAtmosphere({
  density = "subtle",
  particleCount,
  interactive = false,
  speedMultiplier = 1.0,
  className,
  style,
}: AmbientAtmosphereProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (density === "disabled") {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Check reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Check query params / env
    const isE2EDisabled =
      typeof window !== "undefined" &&
      (window.location.search.includes("disable-particles=true") ||
        window.location.search.includes("disable-particles=1"));

    if (prefersReducedMotion || isE2EDisabled) {
      // Motionless / stationary fallback: render 0 animation frames
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const targetCount = Math.min(
      120,
      Math.max(10, particleCount ?? DENSITY_COUNTS[density]),
    );

    const particles: AtmosphereParticle[] = [];
    for (let i = 0; i < targetCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.25 * speedMultiplier,
        radius: Math.random() * 1.4 + 0.6,
        baseAlpha: Math.random() * 0.05 + 0.03,
        alpha: 0.05,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isMouseOver = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseOver = true;
    };

    const handleMouseLeave = () => {
      isMouseOver = false;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    }

    const handleResize = () => {
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 16.666, 2.0);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Read theme-aware acid gold stardust color from computed style
      const stardustColor = "rgba(242, 193, 94, ";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (interactive && isMouseOver) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = ((120 - dist) / 120) * 0.2;
            p.x += (dx / dist) * force;
            p.y += (dy / dist) * force;
          }
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulsePhase += p.pulseSpeed * dt;
        p.alpha = p.baseAlpha + Math.sin(p.pulsePhase) * 0.02;
        const safeAlpha = Math.max(0.01, Math.min(0.08, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${stardustColor}${safeAlpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(renderLoop);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animId);
      } else {
        lastTime = performance.now();
        animId = requestAnimationFrame(renderLoop);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [density, interactive, particleCount, speedMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="ambient-atmosphere-canvas"
      className={cn(
        "ql-ambient-atmosphere pointer-events-none absolute inset-0 z-0 h-full w-full",
        className,
      )}
      style={style}
    />
  );
}
