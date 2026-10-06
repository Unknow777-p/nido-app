import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
function PinPad({
  onSubmit,
  busy,
  error,
  title,
  hint
}) {
  const [pin, setPin] = useState("");
  const slots = Math.max(4, Math.min(6, pin.length || 4));
  function press(d) {
    if (busy) return;
    setPin((p) => (p + d).slice(0, 6));
  }
  function back() {
    if (busy) return;
    setPin((p) => p.slice(0, -1));
  }
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full max-w-xs", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-center text-2xl font-semibold tracking-tight", children: title }),
    hint ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-center text-sm text-muted", children: hint }) : null,
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex justify-center gap-2", children: Array.from({ length: slots }).map((_, i) => /* @__PURE__ */ jsx(
      "span",
      {
        className: cn("size-3 rounded-full", i < pin.length ? "bg-primary" : "bg-bg-warm")
      },
      i
    )) }),
    error ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-sm text-danger", children: error }) : null,
    /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-3 gap-2", children: [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => press(d),
          className: "h-14 rounded-lg bg-surface text-lg font-semibold text-ink shadow-[var(--shadow-card)] active:scale-[0.98]",
          children: d
        },
        d
      )),
      /* @__PURE__ */ jsx("span", {}),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => press("0"),
          className: "h-14 rounded-lg bg-surface text-lg font-semibold text-ink shadow-[var(--shadow-card)] active:scale-[0.98]",
          children: "0"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: back,
          className: "grid h-14 place-items-center rounded-lg text-muted",
          "aria-label": "Borrar",
          children: /* @__PURE__ */ jsx(Delete, { className: "size-5" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      Button,
      {
        className: "mt-4 w-full",
        disabled: busy || pin.length < 4,
        onClick: () => {
          const value = pin;
          setPin("");
          onSubmit(value);
        },
        children: "Continuar"
      }
    )
  ] });
}
export {
  PinPad
};
