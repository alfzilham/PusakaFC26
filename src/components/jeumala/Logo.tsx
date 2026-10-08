import { cn } from "@/lib/utils";

type LogoProps = {
  size?: number;
  className?: string;
  /** use light variant for dark backgrounds (splash) */
  variant?: "default" | "light";
  withWordmark?: boolean;
};

/**
 * JeumalaCup 26 brand logo — a shield emblem with a jersey + "26" badge.
 * Pure SVG so it stays crisp during the splash scale animation.
 */
export function Logo({
  size = 40,
  className,
  variant = "default",
  withWordmark = false,
}: LogoProps) {
  const stroke = variant === "light" ? "#ffffff" : "var(--jc-accent-strong)";
  const fill = variant === "light" ? "rgba(255,255,255,0.12)" : "var(--jc-accent-soft)";
  const text = variant === "light" ? "#ffffff" : "var(--jc-accent-strong)";

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M24 3.5 6.5 9.2v13.4c0 11 7.4 18.6 17.5 22 10.1-3.4 17.5-11 17.5-22V9.2L24 3.5Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 15.5h4.2c.5 1.6 1.7 2.4 3.3 2.4s2.8-.8 3.3-2.4h4.2l3 3.4-3.3 2.4 1 9.8H15.8l1-9.8-3.3-2.4 3-3.4Z"
          fill={variant === "light" ? "rgba(255,255,255,0.92)" : "var(--jc-accent)"}
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <text
          x="24"
          y="29.5"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="var(--font-jakarta), sans-serif"
          fill={variant === "light" ? "#0f766e" : "#ffffff"}
        >
          26
        </text>
      </svg>
      {withWordmark && (
        <span
          className="font-extrabold tracking-tight"
          style={{ color: text, fontSize: size * 0.42 }}
        >
          JeumalaCup <span style={{ opacity: 0.85 }}>26</span>
        </span>
      )}
    </span>
  );
}
