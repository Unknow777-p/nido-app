import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const STARTERS = [
  { label: "Sistema solar", title: "Sistema_solar" },
  { label: "Dinosaurios", title: "Dinosaurio" },
  { label: "Oc\xE9anos", title: "Oc\xE9ano" },
  { label: "Volcanes", title: "Volc\xE1n" }
];
function parseWikiTitle(raw) {
  try {
    const url = new URL(/^https?:/i.test(raw) ? raw : `https://${raw}`);
    const parts = url.pathname.split("/").filter(Boolean);
    const wikiIdx = parts.indexOf("wiki");
    if (wikiIdx >= 0 && parts[wikiIdx + 1]) {
      return decodeURIComponent(parts[wikiIdx + 1]);
    }
  } catch {
  }
  return "Sistema_solar";
}
async function fetchSummary(title) {
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
    headers: { Accept: "application/json" }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.type === "disambiguation") {
    return { title: data.title, extract: data.extract || "Hay varias p\xE1ginas con este nombre. Prueba una b\xFAsqueda m\xE1s concreta.", description: data.description };
  }
  return {
    title: data.title,
    extract: data.extract,
    description: data.description,
    thumbnail: data.thumbnail
  };
}
async function searchWiki(query) {
  const url = new URL("https://es.wikipedia.org/w/api.php");
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "6");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data[1] ?? [];
}
function WikiReader({ initialTitle }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState([]);
  const [article, setArticle] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function openTitle(title) {
    setBusy(true);
    setError(null);
    setHits([]);
    try {
      const summary = await fetchSummary(title);
      if (!summary) {
        setError("No se encontr\xF3 esa p\xE1gina.");
        setArticle(null);
        return;
      }
      setArticle(summary);
    } catch {
      setError("Wikipedia no respondi\xF3. Int\xE9ntalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void openTitle(initialTitle || "Sistema_solar");
  }, [initialTitle]);
  return /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-4", children: [
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "flex gap-2",
        onSubmit: async (e) => {
          e.preventDefault();
          const query = q.trim();
          if (query.length < 2) return;
          setBusy(true);
          setError(null);
          try {
            const next = await searchWiki(query);
            setHits(next);
            if (next[0]) await openTitle(next[0]);
            else setError("Sin resultados. Prueba con otras palabras.");
          } catch {
            setError("No se pudo buscar.");
          } finally {
            setBusy(false);
          }
        },
        children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: q,
              onChange: (e) => setQ(e.target.value),
              placeholder: "Buscar en Wikipedia",
              "aria-label": "Buscar en Wikipedia"
            }
          ),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy, variant: "secondary", size: "icon", "aria-label": "Buscar", children: /* @__PURE__ */ jsx(Search, { className: "size-4" }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: STARTERS.map((s) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => void openTitle(s.title),
        className: "h-9 rounded-full bg-surface-2 px-3 text-xs font-medium text-ink",
        children: s.label
      },
      s.title
    )) }),
    hits.length > 1 ? /* @__PURE__ */ jsx("ul", { className: "flex flex-wrap gap-2", children: hits.map((hit) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "text-sm text-moss underline-offset-4 hover:underline",
        onClick: () => void openTitle(hit),
        children: hit
      }
    ) }, hit)) }) : null,
    error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-danger", children: error }) : null,
    article ? /* @__PURE__ */ jsxs("article", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs font-medium uppercase tracking-[0.12em] text-moss", children: "Wikipedia" }),
      /* @__PURE__ */ jsx("h2", { className: "mt-1 font-display text-2xl font-semibold tracking-tight", children: article.title }),
      article.description ? /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: article.description }) : null,
      article.thumbnail?.source ? /* @__PURE__ */ jsx(
        "img",
        {
          src: article.thumbnail.source,
          alt: "",
          crossOrigin: "anonymous",
          className: "mt-4 max-h-48 w-full rounded-lg object-cover"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "mt-4 grid h-24 place-items-center rounded-lg bg-bg", children: /* @__PURE__ */ jsx(BookOpen, { className: "size-6 text-primary" }) }),
      /* @__PURE__ */ jsx("p", { className: "mt-4 text-sm leading-relaxed text-ink", children: article.extract })
    ] }) : busy ? /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-xl bg-surface-2" }) : null
  ] });
}
export {
  WikiReader,
  parseWikiTitle
};
