import { jsx } from "react/jsx-runtime";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
function Switch({ className, ...props }) {
  return /* @__PURE__ */ jsx(
    SwitchPrimitive.Root,
    {
      className: cn(
        "peer inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-bg-warm transition-colors data-[state=checked]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      ),
      ...props,
      children: /* @__PURE__ */ jsx(SwitchPrimitive.Thumb, { className: "block size-6 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-[22px]" })
    }
  );
}
export {
  Switch
};
