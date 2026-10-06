import { jsx } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
const TONES = {
  pine: "bg-primary text-primary-fg",
  moss: "bg-moss text-primary-fg",
  slate: "bg-slate-av text-primary-fg",
  clay: "bg-clay text-primary-fg",
  dusk: "bg-dusk text-primary-fg"
};
function AvatarBlob({
  name,
  tone,
  size = "md"
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "N";
  return /* @__PURE__ */ jsx(
    "span",
    {
      className: cn(
        "grid shrink-0 place-items-center rounded-full font-display font-semibold",
        TONES[tone] ?? TONES.pine,
        size === "sm" && "size-9 text-sm",
        size === "md" && "size-12 text-lg",
        size === "lg" && "size-16 text-2xl"
      ),
      children: initial
    }
  );
}
export {
  AvatarBlob
};
