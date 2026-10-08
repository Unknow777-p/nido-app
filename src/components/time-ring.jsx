import { jsx, jsxs } from "react/jsx-runtime";
import { formatSeconds } from "@/lib/utils";
function TimeRing({
  remaining,
  total,
  size = 168
}) {
  const safeTotal = Math.max(1, total);
  const ratio = Math.min(1, Math.max(0, remaining / safeTotal));
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;
  return /* @__PURE__ */ jsxs("div", { className: "relative inline-grid place-items-center", style: { width: size, height: size }, children: [
    /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 120 120", className: "size-full -rotate-90", children: [
      /* @__PURE__ */ jsx("circle", { cx: "60", cy: "60", r, fill: "none", stroke: "currentColor", className: "text-bg-warm", strokeWidth: "10" }),
      /* @__PURE__ */ jsx(
        "circle",
        {
          cx: "60",
          cy: "60",
          r,
          fill: "none",
          stroke: "currentColor",
          className: ratio <= 0.12 ? "text-danger" : "text-primary",
          strokeWidth: "10",
          strokeLinecap: "round",
          strokeDasharray: `${dash} ${c}`
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid place-items-center text-center", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-display text-2xl font-semibold tabular-nums leading-none tracking-tight text-ink", style: { fontSize: size * 0.24 }, children: formatSeconds(remaining) }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-muted", style: { fontSize: size * 0.1 }, children: "restantes" })
    ] }) })
  ] });
}
export {
  TimeRing
};
