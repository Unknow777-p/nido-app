import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldOff, Youtube } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WikiReader, parseWikiTitle } from "@/components/wiki-reader";
import { deviceClassify } from "@/lib/family/api";
import { CATALOG_APPS } from "@/lib/filter/catalog";
import { classifyUrl } from "@/lib/filter/classify";
import { cn } from "@/lib/utils";
const TRY_URLS = [
  { label: "Wikipedia", url: "wikipedia.org" },
  { label: "YouTube", url: "youtube.com" },
  { label: "Khan", url: "khanacademy.org" },
  { label: "TikTok", url: "tiktok.com" },
  { label: "Im\xE1genes", url: "google.com/search?tbm=isch&q=playa" }
];
function isWikipedia(host) {
  return host === "wikipedia.org" || host.endsWith(".wikipedia.org");
}
function SafeBrowser({
  token,
  session,
  locked,
  initialUrl,
  onBack
}) {
  const [url, setUrl] = useState(initialUrl);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function check(raw) {
    if (locked) return;
    setBusy(true);
    try {
      const res = await deviceClassify({ data: { token, url: raw } });
      setResult(res);
      setUrl(raw);
      if (res.allowed) {
        // Si está permitido, navegamos realmente en este mismo WebView
        const target = res.rewriteUrl ?? `https://${res.host}`;
        window.location.assign(target);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo revisar");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void check(initialUrl);
  }, [initialUrl]);
  const apps = CATALOG_APPS.filter((app) => {
    if (app.category === "education") return true;
    const toggled = session.appToggles[app.id];
    if (toggled === false) return false;
    if (toggled === true) return true;
    const probe = classifyUrl(
      `https://${app.hosts[0]}`,
      session.filters,
      session.blocked,
      session.allowed,
      session.appToggles
    );
    return probe.allowed;
  });
  if (locked) {
    return /* @__PURE__ */ jsxs("main", { className: "mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 py-6 text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Tiempo en pausa" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted", children: "El cupo de hoy se acab\xF3 o es hora de dormir. Pide m\xE1s minutos al tutor." }),
      /* @__PURE__ */ jsx(Button, { className: "mt-6", variant: "outline", onClick: onBack, children: "Volver" })
    ] });
  }
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6", children: [
    /* @__PURE__ */ jsxs("button", { type: "button", onClick: onBack, className: "inline-flex items-center gap-1 text-sm text-muted", children: [
      /* @__PURE__ */ jsx(ArrowLeft, { className: "size-4" }),
      "Volver"
    ] }),
    /* @__PURE__ */ jsx("h1", { className: "mt-4 font-display text-2xl font-semibold tracking-tight", children: "Navegador seguro" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: "Nido revisa cada direcci\xF3n. Nada se abre fuera de aqu\xED." }),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "mt-5 flex gap-2",
        onSubmit: (e) => {
          e.preventDefault();
          void check(url);
        },
        children: [
          /* @__PURE__ */ jsx(Input, { value: url, onChange: (e) => setUrl(e.target.value), placeholder: "sitio.com" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, children: "Ir" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: TRY_URLS.map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => void check(item.url),
        className: "h-9 rounded-full bg-surface px-3 text-xs font-medium text-muted shadow-[var(--shadow-card)]",
        children: item.label
      },
      item.url
    )) }),
    result ? result.allowed ? /* @__PURE__ */ jsx(AllowedPanel, { result, sourceUrl: url }) : /* @__PURE__ */ jsx(BlockedPanel, { result }) : null,
    /* @__PURE__ */ jsx("h2", { className: "mt-8 text-sm font-medium text-muted", children: "Apps del perfil" }),
    /* @__PURE__ */ jsx("ul", { className: "mt-3 grid grid-cols-2 gap-2", children: apps.map((app) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => void check(app.hosts[0] ?? ""),
        className: "h-16 w-full rounded-lg bg-surface px-3 text-left text-sm font-medium shadow-[var(--shadow-card)]",
        children: app.name
      }
    ) }, app.id)) })
  ] });
}
function BlockedPanel({ result }) {
  return /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl bg-surface-2 px-4 py-5", children: [
    /* @__PURE__ */ jsx(ShieldOff, { className: "size-6 text-danger" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 font-display text-xl font-semibold tracking-tight", children: "Este sitio no es para ti" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: result.reason }),
    result.host ? /* @__PURE__ */ jsx("p", { className: "mt-2 font-mono text-xs text-subtle", children: result.host }) : null,
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs leading-relaxed text-subtle", children: "El tutor ya recibi\xF3 este intento en su tel\xE9fono. Nido no abre la p\xE1gina." })
  ] });
}
function AllowedPanel({ result, sourceUrl }) {
  if (isWikipedia(result.host)) {
    return /* @__PURE__ */ jsx(WikiReader, { initialTitle: parseWikiTitle(sourceUrl) });
  }
  if (result.rewriteUrl?.includes("youtubekids.com") || result.host.includes("youtubekids")) {
    return /* @__PURE__ */ jsxs("div", { className: "mt-5 rounded-xl bg-surface px-4 py-5 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx(Youtube, { className: "size-5 text-primary" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm font-medium", children: "YouTube Kids" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: "El YouTube de adultos no se abre. Nido deja el cat\xE1logo infantil: sin comentarios, sin recomendaciones expl\xEDcitas." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 font-mono text-xs text-subtle", children: "youtubekids.com" })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: cn("mt-5 rounded-xl bg-surface px-4 py-4 shadow-[var(--shadow-card)]"), children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Permitido en este perfil" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: result.reason }),
    result.host ? /* @__PURE__ */ jsx("p", { className: "mt-2 font-mono text-xs text-subtle", children: result.host }) : null,
    /* @__PURE__ */ jsx("p", { className: "mt-3 text-xs leading-relaxed text-subtle", children: "Nido no suelta el control a otra pesta\xF1a. El contenido se queda aquí o se bloquea en este navegador." })
  ] });
}
export {
  SafeBrowser
};
