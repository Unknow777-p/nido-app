import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Clock3, Eye, KeyRound, ShieldCheck, Smartphone } from "lucide-react";
import { Wordmark } from "@/components/mark";
import { InstallNido } from "@/components/install-nido";
import { Button } from "@/components/ui/button";
import { TimeRing } from "@/components/time-ring";
function Landing() {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-bg text-ink", children: [
    /* @__PURE__ */ jsxs("header", { className: "mx-auto flex max-w-5xl items-center justify-between px-5 py-5", children: [
      /* @__PURE__ */ jsx(Wordmark, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Button, { size: "sm", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/login", children: "Entrar" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "mx-auto max-w-5xl px-5 pb-20", children: [
      /* @__PURE__ */ jsxs("section", { className: "grid items-center gap-10 pt-6 md:grid-cols-[1.1fr_0.9fr] md:pt-12", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium uppercase tracking-[0.14em] text-moss", children: "Control parental claro" }),
          /* @__PURE__ */ jsx("h1", { className: "mt-3 font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl", children: "El tiempo en pantalla, en familia." }),
          /* @__PURE__ */ jsx("p", { className: "mt-4 max-w-md text-base leading-relaxed text-muted", children: "Nido asigna un cupo semanal, bloquea contenido sexual y peligroso, y te deja vigilar el uso desde tu tel\xE9fono \u2014 con un PIN que solo el tutor conoce. 30 d\xEDas de prueba, luego $3.99 al mes por familia." }),
          /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-col gap-3 sm:flex-row", children: [
            /* @__PURE__ */ jsx(Button, { size: "lg", asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/login", children: "Crear familia" }) }),
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-bg px-4 py-5 text-center", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Hoy \xB7 Luna" }),
            /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-center", children: /* @__PURE__ */ jsx(TimeRing, { remaining: 48 * 60, total: 90 * 60 }) }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted", children: "de 1 h 30 min asignados" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-2 gap-2 text-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-bg px-3 py-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Filtro" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium", children: "Adulto y riesgo activos" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-bg px-3 py-3", children: [
              /* @__PURE__ */ jsx("p", { className: "text-muted", children: "Noche" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 font-medium", children: "21:00 \u2013 07:00" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4", children: [
        {
          icon: Clock3,
          title: "Cupo semanal",
          body: "Minutos por d\xEDa y tope de la semana. Al acabarse, el dispositivo se queda en espera."
        },
        {
          icon: ShieldCheck,
          title: "Filtro de contenido",
          body: "Bloquea sitios sexuales, violencia, apuestas y b\xFAsquedas de im\xE1genes sensibles."
        },
        {
          icon: Eye,
          title: "Vigilancia desde tu tel\xE9fono",
          body: "Ves el tiempo usado, solicitudes extra y cada intento de salto."
        },
        {
          icon: KeyRound,
          title: "PIN de tutor",
          body: "Salir del modo ni\xF1o o cambiar l\xEDmites requiere el PIN. Tras 5 fallos, 15 min de espera."
        }
      ].map((item) => /* @__PURE__ */ jsxs("article", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
        /* @__PURE__ */ jsx(item.icon, { className: "size-5 text-primary" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-3 font-display text-lg font-semibold tracking-tight", children: item.title }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted", children: item.body })
      ] }, item.title)) }),
      /* @__PURE__ */ jsxs("section", { className: "mt-16 grid gap-8 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-semibold tracking-tight", children: "Tres pasos" }),
          /* @__PURE__ */ jsx("ol", { className: "mt-5 space-y-4", children: [
            "Entras con tu cuenta y creas la familia con un PIN de 4 a 6 d\xEDgitos.",
            "Asignas horas por d\xEDa a cada hijo y activas los filtros.",
            "Instalas Nido en la tablet y la vinculas con un c\xF3digo. El ni\xF1o usa Nido; t\xFA miras el panel."
          ].map((step, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-fg", children: i + 1 }),
            /* @__PURE__ */ jsx("p", { className: "pt-1 text-sm leading-relaxed text-muted", children: step })
          ] }, step)) })
        ] }),
        /* @__PURE__ */ jsxs("aside", { className: "rounded-xl bg-surface-2 p-5", children: [
          /* @__PURE__ */ jsx(Smartphone, { className: "size-5 text-primary" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display text-xl font-semibold tracking-tight", children: "En la pantalla de inicio" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted", children: "Hoy se instala desde el navegador, como una app. El PIN, la pausa remota y el registro de saltos ponen palos en la rueda. El bot\xF3n atr\xE1s no saca del modo ni\xF1o." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted", children: "Controla el tiempo, bloquea sitios y apps, y administra todo desde tu cuenta de tutor." })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { id: "instalar", className: "mt-16 scroll-mt-8", children: /* @__PURE__ */ jsx(InstallNido, { audience: "family" }) }),
      /* @__PURE__ */ jsxs("section", { className: "mt-16 rounded-xl bg-surface p-5 shadow-[var(--shadow-card)] md:p-8", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium uppercase tracking-[0.14em] text-moss", children: "Precio claro" }),
        /* @__PURE__ */ jsx("h2", { className: "mt-2 font-display text-2xl font-semibold tracking-tight", children: "$3.99 al mes" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-lg text-sm leading-relaxed text-muted", children: "Una suscripci\xF3n por familia, no por hijo. Pagas con tu tarjeta, en d\xF3lares." }),
        /* @__PURE__ */ jsxs("ul", { className: "mt-5 space-y-2 text-sm leading-relaxed text-muted", children: [
          /* @__PURE__ */ jsx("li", { children: "30 d\xEDas de prueba al crear la cuenta. Sin cargo en ese tiempo." }),
          /* @__PURE__ */ jsx("li", { children: "Luego $3.99 cada mes, con Visa, Mastercard u otra tarjeta." }),
          /* @__PURE__ */ jsx("li", { children: "Si dejas de pagar, se conserva lo ya configurado; no se a\xF1aden perfiles nuevos." })
        ] })
      ] })
    ] })
  ] });
}
export {
  Landing
};
