import { jsx, jsxs } from "react/jsx-runtime";
import { Wordmark } from "@/components/mark";
function Splash() {
  return /* @__PURE__ */ jsx("div", { className: "grid min-h-dvh place-items-center bg-bg text-ink", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
    /* @__PURE__ */ jsx(Wordmark, {}),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Preparando la familia\u2026" })
  ] }) });
}
export {
  Splash
};
