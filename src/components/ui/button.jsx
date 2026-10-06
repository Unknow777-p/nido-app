import { jsx } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg hover:bg-moss",
        secondary: "bg-surface-2 text-ink hover:bg-bg-warm",
        ghost: "bg-transparent text-ink hover:bg-surface-2",
        outline: "bg-surface text-ink shadow-[var(--shadow-card)] hover:bg-surface-2",
        danger: "bg-danger text-primary-fg hover:opacity-90"
      },
      size: {
        sm: "h-9 rounded-md px-3 text-sm",
        md: "h-11 rounded-lg px-4 text-sm",
        lg: "h-12 rounded-lg px-5 text-base",
        icon: "size-11 rounded-lg"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);
function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size }), className), ...props });
}
export {
  Button
};
