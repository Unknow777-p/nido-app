import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { AvatarBlob } from "@/components/avatar-blob";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { clock } from "@/lib/family/clock";
import {
  addSite,
  createPairingCode,
  getChildDetail,
  parentClassify,
  removeSite,
  revokeDevice,
  setAppToggle,
  setDayLimits,
  updateChild,
  updateFilters
} from "@/lib/family/api";
import { CATALOG_APPS } from "@/lib/filter/catalog";
import { WEEKDAYS, formatMinutes, hostFromInput, lastSeenLabel } from "@/lib/utils";
function ChildDetailPage() {
  const { childId = "" } = useParams();
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["child", childId],
    queryFn: () => getChildDetail({ data: { childId, ...clock() } }),
    refetchInterval: 12e3
  });
  const [tab, setTab] = useState("tiempo");
  if (q.isPending) return /* @__PURE__ */ jsx("div", { className: "h-40 animate-pulse rounded-lg bg-surface-2" });
  if (q.error || !q.data) {
    return /* @__PURE__ */ jsxs("p", { className: "text-sm text-danger", children: [
      "No se pudo cargar el perfil. ",
      /* @__PURE__ */ jsx(Link, { to: "/app", children: "Volver" })
    ] });
  }
  const { child, dayLimits, filters, blocked, allowed, appToggles, activity, week, pairingCode } = q.data;
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(AvatarBlob, { name: child.name, tone: child.avatarKey }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Link, { to: "/app", className: "text-xs text-muted underline-offset-4 hover:underline", children: "Familia" }),
        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: child.name }),
        child.paused ? /* @__PURE__ */ jsx("p", { className: "text-sm text-warn", children: "Pausado ahora desde tu tel\xE9fono" }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-1 overflow-x-auto pb-1", children: [
      ["tiempo", "Tiempo"],
      ["filtros", "Filtros"],
      ["sitios", "Sitios"],
      ["dispositivo", "Dispositivo"],
      ["actividad", "Actividad"]
    ].map(([id, label]) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => setTab(id),
        className: `h-10 shrink-0 rounded-full px-4 text-sm ${tab === id ? "bg-primary text-primary-fg" : "bg-surface text-muted"}`,
        children: label
      },
      id
    )) }),
    tab === "tiempo" ? /* @__PURE__ */ jsx(
      TimeTab,
      {
        childId,
        name: child.name,
        daily: child.dailyMinutes,
        weekly: child.weeklyMinutes,
        bedtimeStart: child.bedtimeStart,
        bedtimeEnd: child.bedtimeEnd,
        dayLimits,
        week,
        onSaved: () => queryClient.invalidateQueries({ queryKey: ["child", childId] })
      }
    ) : null,
    tab === "filtros" ? /* @__PURE__ */ jsx(
      FiltersTab,
      {
        childId,
        filters,
        appToggles,
        onSaved: () => queryClient.invalidateQueries({ queryKey: ["child", childId] })
      }
    ) : null,
    tab === "sitios" ? /* @__PURE__ */ jsx(
      SitesTab,
      {
        childId,
        blocked,
        allowed,
        onSaved: () => queryClient.invalidateQueries({ queryKey: ["child", childId] })
      }
    ) : null,
    tab === "dispositivo" ? /* @__PURE__ */ jsx(
      DeviceTab,
      {
        childId,
        paired: child.devicePaired,
        deviceName: child.deviceName,
        lastSeenAt: child.lastSeenAt,
        online: child.online,
        pairingCode,
        onSaved: () => queryClient.invalidateQueries({ queryKey: ["child", childId] })
      }
    ) : null,
    tab === "actividad" ? /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: activity.length === 0 ? /* @__PURE__ */ jsx("li", { className: "text-sm text-muted", children: "Todav\xEDa no hay actividad." }) : activity.map((row) => /* @__PURE__ */ jsxs("li", { className: "rounded-md bg-surface px-3 py-3 text-sm shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("p", { className: "font-medium capitalize", children: kindLabel(row.kind) }),
      row.detail ? /* @__PURE__ */ jsx("p", { className: "text-muted", children: row.detail }) : null,
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-subtle", children: new Date(row.createdAt).toLocaleString("es") })
    ] }, row.id)) }) : null
  ] });
}
function TimeTab({
  childId,
  name,
  daily,
  weekly,
  bedtimeStart,
  bedtimeEnd,
  dayLimits,
  week,
  onSaved
}) {
  const [d, setD] = useState(daily);
  const [w, setW] = useState(weekly);
  const [curfew, setCurfew] = useState(Boolean(bedtimeStart && bedtimeEnd));
  const [start, setStart] = useState(bedtimeStart ?? "21:00");
  const [end, setEnd] = useState(bedtimeEnd ?? "07:00");
  const [limits, setLimits] = useState(() => {
    const map = new Map(dayLimits.map((x) => [x.weekday, x.minutes]));
    return WEEKDAYS.map((day) => ({ weekday: day.id, minutes: map.get(day.id) ?? daily }));
  });
  const save = useMutation({
    mutationFn: async () => {
      await updateChild({
        data: {
          childId,
          dailyMinutes: d,
          weeklyMinutes: w,
          bedtimeStart: curfew ? start : null,
          bedtimeEnd: curfew ? end : null
        }
      });
      await setDayLimits({ data: { childId, limits } });
    },
    onSuccess: () => {
      toast.success("Tiempo actualizado");
      onSaved();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "h-44 rounded-lg bg-surface p-3 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsxs("p", { className: "px-2 text-sm text-muted", children: [
        "Uso esta semana \xB7 ",
        name
      ] }),
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: "90%", children: /* @__PURE__ */ jsxs(BarChart, { data: week.map((p) => ({ ...p, label: p.day.slice(5) })), children: [
        /* @__PURE__ */ jsx(XAxis, { dataKey: "label", tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(YAxis, { width: 28, tick: { fontSize: 11 } }),
        /* @__PURE__ */ jsx(Bar, { dataKey: "minutes", fill: "var(--color-primary)", radius: [4, 4, 0, 0] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Minutos por d\xEDa (base)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            className: "mt-1.5",
            type: "number",
            min: 15,
            max: 480,
            value: d,
            onChange: (e) => setD(Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(Label, { children: "Tope semanal (min)" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            className: "mt-1.5",
            type: "number",
            min: 60,
            max: 2500,
            value: w,
            onChange: (e) => setW(Number(e.target.value))
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "sm:col-span-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-card)]", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Toque de queda" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted", children: "Fuera de este horario el dispositivo se queda en espera." })
        ] }),
        /* @__PURE__ */ jsx(Switch, { checked: curfew, onCheckedChange: setCurfew })
      ] }) }),
      curfew ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Inicio de noche" }),
          /* @__PURE__ */ jsx(Input, { className: "mt-1.5", type: "time", value: start, onChange: (e) => setStart(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx(Label, { children: "Fin de noche" }),
          /* @__PURE__ */ jsx(Input, { className: "mt-1.5", type: "time", value: end, onChange: (e) => setEnd(e.target.value) })
        ] })
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Cupo por d\xEDa" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: WEEKDAYS.map((day, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "w-10 text-sm text-muted", children: day.short }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "range",
            min: 0,
            max: 240,
            step: 15,
            value: limits[i]?.minutes ?? 0,
            onChange: (e) => {
              const minutes = Number(e.target.value);
              setLimits((prev) => prev.map((row) => row.weekday === day.id ? { ...row, minutes } : row));
            },
            className: "flex-1 accent-primary"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "w-16 text-right text-sm tabular-nums", children: formatMinutes(limits[i]?.minutes ?? 0) })
      ] }, day.id)) })
    ] }),
    /* @__PURE__ */ jsx(Button, { onClick: () => save.mutate(), disabled: save.isPending, children: "Guardar tiempo" })
  ] });
}
function FiltersTab({
  childId,
  filters,
  appToggles,
  onSaved
}) {
  const [f, setF] = useState(filters);
  const save = useMutation({
    mutationFn: () => updateFilters({ data: { childId, filters: f } }),
    onSuccess: () => {
      toast.success("Filtros guardados");
      onSaved();
    }
  });
  const rows = [
    { key: "blockAdult", title: "Contenido sexual", body: "Sitios para adultos y palabras clave expl\xEDcitas." },
    { key: "blockViolence", title: "Violencia gr\xE1fica", body: "Gore y contenido extremo." },
    { key: "blockGambling", title: "Apuestas", body: "Casinos y apuestas en l\xEDnea." },
    { key: "blockDrugs", title: "Drogas", body: "Mercados y foros de sustancias." },
    { key: "blockHate", title: "Odio", body: "Comunidades de odio conocidas." },
    { key: "blockSocial", title: "Redes sociales", body: "TikTok, Instagram, Discord y similares." },
    { key: "blockImageSearch", title: "B\xFAsqueda de im\xE1genes", body: "Evita resultados visuales sensibles." },
    { key: "forceSafeSearch", title: "B\xFAsqueda segura", body: "Fuerza SafeSearch en Google, Bing y YouTube." }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx(FilterTester, { childId }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-2", children: rows.map((row) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: row.title }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted", children: row.body })
      ] }),
      /* @__PURE__ */ jsx(Switch, { checked: f[row.key], onCheckedChange: (v) => setF((prev) => ({ ...prev, [row.key]: v })) })
    ] }, row.key)) }),
    /* @__PURE__ */ jsx(Button, { onClick: () => save.mutate(), disabled: save.isPending, children: "Guardar filtros" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "Apps y destinos" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: "Un interruptor por destino frecuente. Lo educativo queda abierto." }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2", children: CATALOG_APPS.map((app) => {
        const defaultOn = app.category === "education" || !f.blockSocial && app.category === "social" || app.category === "video" || app.category === "games";
        const allowed = appToggles[app.id] ?? defaultOn;
        return /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-card)]", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: app.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted", children: app.description })
          ] }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: allowed,
              onCheckedChange: async (v) => {
                await setAppToggle({ data: { childId, appId: app.id, allowed: v } });
                onSaved();
              }
            }
          )
        ] }, app.id);
      }) })
    ] })
  ] });
}
function FilterTester({ childId }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  async function run(raw) {
    setBusy(true);
    try {
      const res = await parentClassify({ data: { childId, url: raw } });
      setResult(res);
      setUrl(raw);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo probar");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "Probar el filtro" }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: "Escribe un sitio. Nido te dice si este perfil lo dejar\xEDa pasar. No se abre la p\xE1gina." }),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "mt-3 flex gap-2",
        onSubmit: (e) => {
          e.preventDefault();
          void run(url);
        },
        children: [
          /* @__PURE__ */ jsx(Input, { value: url, onChange: (e) => setUrl(e.target.value), placeholder: "sitio.com" }),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy || url.trim().length < 3, children: "Probar" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-2", children: [
      { label: "Adulto", url: "pornhub.com" },
      { label: "TikTok", url: "tiktok.com" },
      { label: "YouTube", url: "youtube.com" },
      { label: "Wikipedia", url: "wikipedia.org" }
    ].map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => void run(item.url),
        className: "h-9 rounded-full bg-bg px-3 text-xs font-medium text-muted",
        children: item.label
      },
      item.url
    )) }),
    result ? /* @__PURE__ */ jsxs("p", { className: `mt-3 text-sm ${result.allowed ? "text-ok" : "text-danger"}`, children: [
      result.allowed ? "Permitido" : "Bloqueado",
      " \xB7 ",
      result.reason
    ] }) : null
  ] });
}
function SitesTab({
  childId,
  blocked,
  allowed,
  onSaved
}) {
  const [host, setHost] = useState("");
  const [list, setList] = useState("blocked");
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "flex flex-col gap-2 sm:flex-row",
        onSubmit: async (e) => {
          e.preventDefault();
          const parsed = hostFromInput(host);
          if (!parsed) {
            toast.error("Escribe un dominio, por ejemplo tiktok.com");
            return;
          }
          await addSite({ data: { childId, host: parsed, list } });
          setHost("");
          onSaved();
        },
        children: [
          /* @__PURE__ */ jsx(Input, { value: host, onChange: (e) => setHost(e.target.value), placeholder: "ejemplo.com" }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx(Button, { type: "button", variant: list === "blocked" ? "primary" : "secondary", onClick: () => setList("blocked"), children: "Bloquear" }),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: list === "allowed" ? "primary" : "secondary", onClick: () => setList("allowed"), children: "Permitir" })
          ] }),
          /* @__PURE__ */ jsx(Button, { type: "submit", children: "A\xF1adir" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      ListBlock,
      {
        title: "Bloqueados",
        rows: blocked,
        onRemove: async (id) => {
          await removeSite({ data: { childId, id, list: "blocked" } });
          onSaved();
        }
      }
    ),
    /* @__PURE__ */ jsx(
      ListBlock,
      {
        title: "Permitidos siempre",
        rows: allowed,
        onRemove: async (id) => {
          await removeSite({ data: { childId, id, list: "allowed" } });
          onSaved();
        }
      }
    )
  ] });
}
function ListBlock({
  title,
  rows,
  onRemove
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium", children: title }),
    rows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted", children: "Ninguno." }) : /* @__PURE__ */ jsx("ul", { className: "mt-2 space-y-1", children: rows.map((r) => /* @__PURE__ */ jsxs("li", { className: "flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm", children: [
      r.host,
      /* @__PURE__ */ jsx("button", { type: "button", className: "text-muted underline-offset-4 hover:underline", onClick: () => onRemove(r.id), children: "Quitar" })
    ] }, r.id)) })
  ] });
}
function DeviceTab({
  childId,
  paired,
  deviceName,
  lastSeenAt,
  online,
  pairingCode,
  onSaved
}) {
  const [code, setCode] = useState(pairingCode);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsxs("ol", { className: "space-y-2 text-sm leading-relaxed text-muted", children: [
      /* @__PURE__ */ jsx("li", { children: "1. En la tablet, instala Nido en la pantalla de inicio y \xE1brela." }),
      /* @__PURE__ */ jsx("li", { children: "2. Genera un c\xF3digo aqu\xED. Vale 15 minutos y se usa una sola vez." }),
      /* @__PURE__ */ jsx("li", { children: "3. En la tablet: Vincular dispositivo. Para salir hace falta tu PIN." })
    ] }),
    paired ? /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
      deviceName ?? "Dispositivo",
      " \xB7 ",
      lastSeenLabel(lastSeenAt, online)
    ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Todav\xEDa no hay un dispositivo vinculado." }),
    code ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-bg px-4 py-5 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "font-display text-4xl font-semibold tracking-[0.2em]", children: code }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "mt-2 text-xs text-muted underline-offset-4 hover:underline",
          onClick: async () => {
            try {
              await navigator.clipboard.writeText(code);
              toast.success("C\xF3digo copiado");
            } catch {
              toast.error("No se pudo copiar");
            }
          },
          children: "Copiar"
        }
      )
    ] }) : null,
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: async () => {
            const res = await createPairingCode({ data: { childId } });
            setCode(res.code);
            onSaved();
          },
          children: "Generar c\xF3digo"
        }
      ),
      paired ? /* @__PURE__ */ jsx(
        Button,
        {
          variant: "secondary",
          onClick: async () => {
            await revokeDevice({ data: { childId } });
            setCode(null);
            toast.success("Dispositivo desvinculado");
            onSaved();
          },
          children: "Desvincular"
        }
      ) : null
    ] })
  ] });
}
function kindLabel(kind) {
  switch (kind) {
    case "block":
      return "Bloqueo";
    case "browse":
      return "Navegaci\xF3n";
    case "request":
      return "Solicitud";
    case "grant":
      return "Tiempo extra";
    case "tamper":
      return "Intento de salto";
    case "pause":
      return "Pausa";
    case "resume":
      return "Reanudado";
    case "unlock":
      return "PIN correcto";
    case "pair":
      return "Dispositivo";
    case "filter":
      return "Filtros";
    case "schedule":
      return "Horario";
    default:
      return kind;
  }
}
export {
  ChildDetailPage
};
