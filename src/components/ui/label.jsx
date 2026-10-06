import { jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function Label({ className, ...props }) {
  return /* @__PURE__ */ jsx("label", { className: cn("text-sm font-medium text-ink", className), ...props });
}
export {
  Label
};
