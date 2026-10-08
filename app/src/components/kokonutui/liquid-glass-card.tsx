"use client";

/**
 * @author: @dorianbaffier (Modified for self-contained Next.js workspace)
 * @description: Liquid Glass Card & Button - Self-contained version without shadcn/cva dependencies
 * @license: MIT
 * @website: https://kokonutui.com
 */

import React from "react";

// Helper function to combine class names
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(" ");
}

// Constants for glass styling
const GLASS_SHADOW_LIGHT =
  "shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(0,0,0,0.9),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.85),inset_1px_1px_1px_-0.5px_rgba(0,0,0,0.6),inset_-1px_-1px_1px_-0.5px_rgba(0,0,0,0.6),inset_0_0_6px_6px_rgba(0,0,0,0.12),inset_0_0_2px_2px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.15)]";

const GLASS_SHADOW_DARK =
  "dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),inset_0_0_2px_2px_rgba(255,255,255,0.06),0_0_12px_rgba(0,0,0,0.15)]";

const GLASS_SHADOW = `${GLASS_SHADOW_LIGHT} ${GLASS_SHADOW_DARK}`;

const DEFAULT_GLASS_FILTER_SCALE = 30;
const BUTTON_GLASS_FILTER_SCALE = 70;

// Shared glass filter component
interface GlassFilterProps {
  id: string;
  scale?: number;
}

const GlassFilter = React.memo(
  ({ id, scale = DEFAULT_GLASS_FILTER_SCALE }: GlassFilterProps) => (
    <svg aria-hidden="true" className="hidden" focusable={false}>
      <title>Glass Effect Filter</title>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          height="200%"
          id={id}
          width="200%"
          x="-50%"
          y="-50%"
        >
          <feTurbulence
            baseFrequency="0.05 0.05"
            numOctaves="1"
            result="turbulence"
            seed="1"
            type="fractalNoise"
          />
          <feGaussianBlur
            in="turbulence"
            result="blurredNoise"
            stdDeviation="2"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            result="displaced"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="B"
          />
          <feGaussianBlur in="displaced" result="finalBlur" stdDeviation="4" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
);
GlassFilter.displayName = "GlassFilter";

// Liquid Button
export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  liquidVariant?: "default" | "none";
}

export function LiquidButton({
  className,
  liquidVariant = "default",
  children,
  ...props
}: LiquidButtonProps) {
  const filterId = React.useId();

  const buttonClasses = cn(
    "relative transition-transform duration-200 motion-reduce:transition-none cursor-pointer",
    liquidVariant === "default"
      ? "active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:hover:scale-100 [@media(hover:hover)]:hover:scale-105"
      : "",
    className
  );

  return (
    <>
      <button className={buttonClasses} {...props}>
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit]",
            GLASS_SHADOW
          )}
        />
        <div
          className="pointer-events-none absolute inset-0 isolate -z-10 overflow-hidden rounded-[inherit]"
          style={{ backdropFilter: `url("#${filterId}")` }}
        />
        <span className="relative z-10">{children}</span>
      </button>
      <GlassFilter id={filterId} scale={BUTTON_GLASS_FILTER_SCALE} />
    </>
  );
}

// Liquid Glass Card
export interface LiquidGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glassSize?: "none" | "sm" | "default" | "lg";
  glassEffect?: boolean;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

export function LiquidGlassCard({
  className,
  glassSize = "default",
  glassEffect = true,
  contentClassName,
  contentStyle,
  children,
  ...props
}: LiquidGlassCardProps) {
  const filterId = React.useId();

  const cardClasses = cn(
    "group relative overflow-hidden bg-background/20 backdrop-blur-[2px] rounded-xl border border-white/10 text-white shadow-xl transition-all duration-300",
    glassSize === "sm" ? "p-4" : glassSize === "lg" ? "p-8" : glassSize === "none" ? "p-0" : "p-6",
    className
  );

  return (
    <div className={cardClasses} {...props}>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          GLASS_SHADOW
        )}
      />

      {glassEffect && (
        <>
          <div
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]"
            style={{ backdropFilter: `url("#${filterId}")` }}
          />
          <GlassFilter id={filterId} scale={DEFAULT_GLASS_FILTER_SCALE} />
        </>
      )}

      <div className={cn("relative z-10", contentClassName)} style={contentStyle}>{children}</div>

      <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 dark:via-white/5" />
    </div>
  );
}
