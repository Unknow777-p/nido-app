import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/mark";
function detect() {
  const ua = navigator.userAgent || "";
  const touch = navigator.maxTouchPoints || 0;
  const isiPad = /iPad/.test(ua) || /Macintosh/.test(ua) && touch > 1;
  const isiPhone = /iPhone|iPod/.test(ua);
  const os = ua.match(/iPhone OS (\d+)[._]/) ?? ua.match(/CPU OS (\d+)[._]\d+ like Mac OS X/);
  const safari = ua.match(/Version\/(\d+)[._]/);
  const major = Math.max(os ? parseInt(os[1], 10) : 0, safari ? parseInt(safari[1], 10) : 0);
  return { isIOS: isiPhone || isiPad, isiPad, ios27: major >= 27 };
}
function Glass({ src }) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      "aria-hidden": "true",
      className: "inline-grid size-11 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 backdrop-blur",
      children: /* @__PURE__ */ jsx("img", { src, width: 24, height: 24, alt: "" })
    }
  );
}
function InstallPage() {
  const info = useMemo(detect, []);
  const where = info.isiPad ? "en la barra de herramientas" : "en la barra inferior";
  return /* @__PURE__ */ jsxs("main", { className: "flex min-h-dvh flex-col items-center bg-black px-6 py-10 text-white", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", className: "invert-[.9]", children: /* @__PURE__ */ jsx(Wordmark, {}) }),
    info.isIOS ? /* @__PURE__ */ jsxs("section", { className: "mt-8 flex w-full max-w-md flex-col items-center text-center", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: info.isiPad ? "/install/ob-ipad.png" : "/install/ob-phone.png",
          alt: "",
          "aria-hidden": "true",
          className: "w-full max-w-sm"
        }
      ),
      /* @__PURE__ */ jsx("h1", { className: "mt-8 font-display text-3xl font-semibold tracking-tight", children: "A\xF1ade Nido a tu\xA0pantalla\xA0de\xA0inicio" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-5 text-lg", children: [
        info.ios27 ? /* @__PURE__ */ jsxs("p", { className: "flex flex-wrap items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-white/60", children: "Toca" }),
          /* @__PURE__ */ jsx(Glass, { src: "/install/glass-puzzle.svg" }),
          /* @__PURE__ */ jsxs("span", { className: "text-white/60", children: [
            where,
            ", y luego"
          ] }),
          /* @__PURE__ */ jsx(Glass, { src: "/install/glass-share.svg" })
        ] }) : /* @__PURE__ */ jsxs("p", { className: "flex flex-wrap items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-white/60", children: "Toca" }),
          /* @__PURE__ */ jsx(Glass, { src: "/install/glass-share.svg" }),
          /* @__PURE__ */ jsx("span", { className: "text-white/60", children: where })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "flex flex-wrap items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-white/60", children: "Elige" }),
          /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/15", children: [
            /* @__PURE__ */ jsx("img", { src: "/install/plus.svg", width: 16, height: 16, alt: "" }),
            "A\xF1adir a pantalla de inicio"
          ] })
        ] })
      ] })
    ] }) : /* @__PURE__ */ jsxs("section", { className: "mt-16 max-w-md text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "Abre este enlace en tu iPhone\xA0o\xA0iPad" }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-white/60", children: "Esta gu\xEDa muestra c\xF3mo a\xF1adir Nido a la pantalla de inicio de iOS." }),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "mt-8 inline-block rounded-full bg-white px-6 py-3 font-medium text-black",
          children: "Abrir Nido"
        }
      )
    ] })
  ] });
}
export {
  InstallPage
};
