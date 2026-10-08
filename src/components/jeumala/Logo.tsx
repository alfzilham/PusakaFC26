import { cn } from "@/lib/utils";
import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
  /** use light variant for dark backgrounds (splash) */
  variant?: "default" | "light";
  withWordmark?: boolean;
};

/** JeumalaCup 26 brand logo using the supplied official brand asset. */
export function Logo({
  size = 40,
  className,
  variant = "default",
  withWordmark = false,
}: LogoProps) {
  const text = variant === "light" ? "#ffffff" : "var(--jc-accent-strong)";

  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-hidden="true"
    >
      <Image
        src="/logo.webp"
        alt=""
        width={size}
        height={size}
        priority={size >= 96}
        className="shrink-0 object-contain"
      />
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
