import { clsx } from "@/lib/clsx";

type PillVariant = "default" | "accent" | "sale";

const variants: Record<PillVariant, string> = {
  default: "bg-surface-muted text-gray-700 hover:bg-gray-200",
  accent: "bg-violet/10 text-violet",
  sale: "bg-violet-muted text-gray-900 font-semibold",
};

export function Pill({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: PillVariant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
