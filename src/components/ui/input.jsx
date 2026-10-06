import { jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function Input({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    "input",
    {
      className: cn(
        "h-11 w-full rounded-lg bg-surface px-3 text-base text-ink shadow-[var(--shadow-card)] placeholder:text-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
        className
      ),
      ...props
    }
  );
}
export {
  Input
};
