import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
function NestMark({ className }) {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      viewBox: "0 0 32 32",
      className: cn("text-primary", className),
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M6 20.5c2.8 3.8 6.4 5.7 10 5.7s7.2-1.9 10-5.7",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.2",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8.5 17.2c2.2 2.6 4.8 3.9 7.5 3.9s5.3-1.3 7.5-3.9",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2.2",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx("circle", { cx: "16", cy: "13.2", r: "3.1", fill: "currentColor" })
      ]
    }
  );
}
function Wordmark({ className }) {
  return /* @__PURE__ */ jsxs("span", { className: cn("inline-flex items-center gap-2 text-ink", className), children: [
    /* @__PURE__ */ jsx(NestMark, { className: "size-7" }),
    /* @__PURE__ */ jsx("span", { className: "font-display text-xl font-semibold tracking-tight", children: "Nido" })
  ] });
}
export {
  NestMark,
  Wordmark
};
