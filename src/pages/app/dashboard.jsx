import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Pause, Play, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AvatarBlob } from "@/components/avatar-blob";
import { InstallNido } from "@/components/install-nido";
import { PlanBanner } from "@/components/plan-card";
import { TimeRing } from "@/components/time-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clock, clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId, setActiveFamilyId } from "@/lib/family/active";
import {
  addChild,
  getFamily,
  grantExtraTime,
  revokeExtraTime,
  respondTimeRequest,
  setChildPaused
} from "@/lib/family/api";
import { AGE_BANDS } from "@/lib/filter/catalog";
import { formatMinutes, formatSeconds, lastSeenLabel } from "@/lib/utils";
function Dashboard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const familyQuery = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() }),
    refetchInterval: 12e3
  });
  const data = familyQuery.data;
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("10-12");
  const addMut = useMutation({
    mutationFn: () => addChild({ data: { name: newName, ageBand: newAge, familyId: getActiveFamilyId() ?? void 0 } }),
    onSuccess: async () => {
      setShowAdd(false);
      setNewName("");
      await queryClient.invalidateQueries({ queryKey: ["family"] });
    },
    onError: (e) => toast.error(e.message)
  });
  const respondMut = useMutation({
    mutationFn: (input) => respondTimeRequest({ data: { ...input, localDate: clock().localDate } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["family"] })
  });
  if (!data) return null;
  const unpaired = data.children.filter((c) => !c.devicePaired);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: data.family.name }),
        /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "Hoy" })
      ] }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "secondary",
          size: "sm",
          onClick: () => {
            if (data.plan.status === "expired") {
              void navigate("/app/ajustes");
              return;
            }
            setShowAdd((v) => !v);
          },
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
            "A\xF1adir"
          ]
        }
      )
    ] }),
    data.families && data.families.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "rounded-lg bg-surface px-3 py-2 text-sm shadow-[var(--shadow-card)]",
          value: getActiveFamilyId() ?? data.family.id,
          onChange: (e) => {
            setActiveFamilyId(e.target.value);
            void queryClient.invalidateQueries();
          },
          children: data.families.map((f) => /* @__PURE__ */ jsx("option", { value: f.id, children: f.name }, f.id))
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "secondary",
          size: "sm",
          onClick: () => navigate("/onboarding?nueva=1"),
          children: "Nueva familia"
        }
      )
    ] }) : null,
    /* @__PURE__ */ jsx(PlanBanner, { plan: data.plan, onPay: () => navigate("/app/ajustes") }),
    unpaired.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Siguiente paso" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm leading-relaxed text-muted", children: [
        "Instala Nido en la tablet de ",
        unpaired.map((c) => c.name).join(", "),
        " (pantalla de inicio) y luego vinc\xFAlala. En su perfil: Dispositivo \u2192 Generar c\xF3digo. En el otro aparato, abre Nido \u2192 Vincular."
      ] })
    ] }) : null,
    /* @__PURE__ */ jsx(InstallNido, { variant: "compact", audience: "family" }),
    data.children.some((c) => c.blockedToday > 0 || c.tamperToday > 0) ? /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Alertas de hoy" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-2 text-sm", children: data.children.filter((c) => c.blockedToday > 0 || c.tamperToday > 0).map((c) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-baseline justify-between gap-2", children: [
        /* @__PURE__ */ jsx(Link, { to: `/app/${c.id}`, className: "font-medium", children: c.name }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted", children: [
          c.blockedToday > 0 ? `${c.blockedToday} bloqueo${c.blockedToday === 1 ? "" : "s"}` : null,
          c.blockedToday > 0 && c.tamperToday > 0 ? " \xB7 " : null,
          c.tamperToday > 0 ? `${c.tamperToday} intento${c.tamperToday === 1 ? "" : "s"} de salto` : null
        ] })
      ] }, c.id)) })
    ] }) : null,
    data.pendingRequests.length > 0 ? /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium", children: "Solicitudes de tiempo" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 space-y-3", children: data.pendingRequests.map((req) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: req.childName }),
          /* @__PURE__ */ jsxs("span", { className: "text-muted", children: [
            " pide ",
            req.minutes,
            " min"
          ] }),
          req.reason ? /* @__PURE__ */ jsxs("span", { className: "text-muted", children: [
            " \xB7 ",
            req.reason
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", onClick: () => respondMut.mutate({ requestId: req.id, approve: false }), children: "No" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => respondMut.mutate({ requestId: req.id, approve: true }), children: "Aprobar" })
        ] })
      ] }, req.id)) })
    ] }) : null,
    showAdd ? /* @__PURE__ */ jsxs(
      "form",
      {
        className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]",
        onSubmit: (e) => {
          e.preventDefault();
          addMut.mutate();
        },
        children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "n", children: "Nombre" }),
          /* @__PURE__ */ jsx(Input, { id: "n", className: "mt-1.5", value: newName, onChange: (e) => setNewName(e.target.value), required: true }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-2 gap-2", children: AGE_BANDS.map((b) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setNewAge(b.id),
              className: `rounded-md px-3 py-2 text-left text-sm ${newAge === b.id ? "bg-primary text-primary-fg" : "bg-bg"}`,
              children: b.label
            },
            b.id
          )) }),
          /* @__PURE__ */ jsx(Button, { className: "mt-3", type: "submit", disabled: addMut.isPending, children: "Guardar perfil" })
        ]
      }
    ) : null,
    /* @__PURE__ */ jsx("section", { className: "grid gap-3 sm:grid-cols-2", children: data.children.map((child) => /* @__PURE__ */ jsx(
      ChildCard,
      {
        child,
        onGrant: async (minutes) => {
          try {
            await grantExtraTime({ data: { childId: child.id, minutes, localDate: clock().localDate } });
            await queryClient.invalidateQueries({ queryKey: ["family"] });
            toast.success(`+${minutes} min para ${child.name}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo a\xF1adir tiempo");
          }
        },
        onPause: async (paused) => {
          try {
            await setChildPaused({ data: { childId: child.id, paused } });
            await queryClient.invalidateQueries({ queryKey: ["family"] });
            toast.success(paused ? `${child.name} en pausa` : `${child.name} reanudado`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo pausar");
          }
        },
        onRemoveExtra: async () => {
          try {
            await revokeExtraTime({ data: { childId: child.id, localDate: clock().localDate } });
            await queryClient.invalidateQueries();
            toast.success(`Tiempo extra quitado a ${child.name}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo quitar tiempo");
          }
        }
      },
      child.id
    )) })
  ] });
}
function ChildCard({
  child,
  onGrant,
  onPause,
  onRemoveExtra
}) {
  const status = child.lockReason === "paused" ? "Pausado" : child.lockReason === "bedtime" ? "Hora de dormir" : child.lockReason === "week" ? "Tope semanal" : child.lockReason === "time" ? "Tiempo agotado" : "Activo";
  const weekPct = Math.min(100, child.usedWeekSeconds / Math.max(1, child.weeklyMinutes * 60) * 100);
  return /* @__PURE__ */ jsxs("article", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(AvatarBlob, { name: child.name, tone: child.avatarKey }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: child.name }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted", children: [
            child.ageBand,
            " a\xF1os"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-muted", children: status })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsx(TimeRing, { remaining: child.remainingSeconds, total: child.limitTodayMinutes * 60, size: 128 }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-muted", children: [
          /* @__PURE__ */ jsx(Clock3, { className: "size-4 shrink-0" }),
          formatSeconds(child.usedTodaySeconds),
          " de ",
          formatMinutes(child.limitTodayMinutes)
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-muted", children: [
            "Semana ",
            formatSeconds(child.usedWeekSeconds),
            " / ",
            formatMinutes(child.weeklyMinutes)
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-warm", children: /* @__PURE__ */ jsx("div", { className: "h-full rounded-full bg-primary", style: { width: `${weekPct}%` } }) })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted", children: child.devicePaired ? lastSeenLabel(child.lastSeenAt, child.online) : "Sin dispositivo" }),
        child.blockedToday > 0 ? /* @__PURE__ */ jsxs("p", { className: "text-danger", children: [
          child.blockedToday,
          " sitios bloqueados hoy"
        ] }) : null
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: `/app/${child.id}`, children: "Ajustar" }) }),
      /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "sm", onClick: () => onGrant(15), children: "+15 min" }),
      child.extraTodayMinutes > 0 ? /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => onRemoveExtra(), children: `Quitar +${child.extraTodayMinutes} min` }) : null,
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: child.paused ? "primary" : "outline",
          size: "sm",
          onClick: () => onPause(!child.paused),
          children: [
            child.paused ? /* @__PURE__ */ jsx(Play, { className: "size-4" }) : /* @__PURE__ */ jsx(Pause, { className: "size-4" }),
            child.paused ? "Reanudar" : "Pausar"
          ]
        }
      ),
      ""
    ] })
  ] });
}
export {
  Dashboard
};
