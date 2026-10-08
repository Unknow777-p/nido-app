import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { BookOpen, Globe, Moon, Pause } from "lucide-react";
import { toast } from "sonner";
import { NestMark } from "@/components/mark";

import { PinPad } from "@/components/pin-pad";
import { SafeBrowser } from "@/components/safe-browser";
import { TimeRing } from "@/components/time-ring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clock } from "@/lib/family/clock";
import { clearDeviceToken, readDeviceToken, writeDeviceToken } from "@/lib/family/device-store";
import {
  deviceHeartbeat,
  deviceReportTamper,
  deviceRequestTime,
  deviceSession,
  deviceVerifyPin,
  pairDevice
} from "@/lib/family/api";
import { SAFE_DESTINATIONS } from "@/lib/filter/catalog";
import { formatSeconds } from "@/lib/utils";
function DevicePage() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setToken(readDeviceToken());
    setReady(true);
  }, []);
  if (!ready) return /* @__PURE__ */ jsx("div", { className: "min-h-dvh bg-bg" });
  if (!token) return /* @__PURE__ */ jsx(PairScreen, { onPaired: setToken });
  return /* @__PURE__ */ jsx(ChildHome, { token, onUnpair: () => setToken(null) });
}
function PairScreen({ onPaired }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const mutate = useMutation({
    mutationFn: () => pairDevice({
      data: {
        code,
        deviceName: navigator.userAgent.includes("Mobile") ? "Tablet" : "Este dispositivo",
        ...clock()
      }
    }),
    onSuccess: (res) => {
      writeDeviceToken(res.token);
      void document.documentElement.requestFullscreen?.().catch(() => void 0);
      onPaired(res.token);
    },
    onError: (e) => setError(e.message)
  });
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10", children: [
    /* @__PURE__ */ jsx(NestMark, { className: "size-12" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-4 font-display text-3xl font-semibold tracking-tight", children: "Vincular dispositivo" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm leading-relaxed text-muted", children: "En el tel\xE9fono del padre: perfil del ni\xF1o \u2192 Dispositivo \u2192 Generar c\xF3digo. Caduca en 15 minutos." }),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "mt-8 space-y-4",
        onSubmit: (e) => {
          e.preventDefault();
          setError(null);
          mutate.mutate();
        },
        children: [
          /* @__PURE__ */ jsx(
            Input,
            {
              value: code,
              onChange: (e) => setCode(e.target.value.toUpperCase().slice(0, 8)),
              placeholder: "AB12CD",
              className: "text-center font-display text-2xl tracking-[0.3em]",
              autoCapitalize: "characters",
              autoComplete: "off",
              inputMode: "text"
            }
          ),
          error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-danger", children: error }) : null,
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: code.length < 6 || mutate.isPending, children: "Vincular" })
        ]
      }
    ),

    /* @__PURE__ */ jsx(Link, { to: "/", className: "mt-4 text-center text-sm text-muted underline-offset-4 hover:underline", children: "Volver" })
  ] });
}
function ChildHome({ token, onUnpair }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const onUnpairRef = useRef(onUnpair);
  onUnpairRef.current = onUnpair;
  const [view, setView] = useState("home");
  const [browseStart, setBrowseStart] = useState("wikipedia.org");
  const [pinError, setPinError] = useState(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [accessibilityOn, setAccessibilityOn] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        if (typeof window.Android !== "undefined" && window.Android.isAccessibilityEnabled) {
          setAccessibilityOn(!!window.Android.isAccessibilityEnabled());
        }
      } catch {
        void 0;
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, []);
  useChildKiosk(token);
  const sessionQuery = useQuery({
    queryKey: ["device-session", token],
    queryFn: () => deviceSession({ data: { token, ...clock() } }),
    refetchInterval: 1e4,
    retry: false
  });
  useEffect(() => {
    let cancelled = false;
    async function beat() {
      try {
        const res = await deviceHeartbeat({ data: { token, ...clock() } });
        if (!cancelled) queryClient.setQueryData(["device-session", token], res.session);
      } catch {
        if (!cancelled) {
          clearDeviceToken();
          onUnpairRef.current();
        }
      }
    }
    void beat();
    const id = window.setInterval(() => void beat(), 1e4);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token, queryClient]);
  useEffect(() => {
    let hiddenAt = null;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt > 15e3) {
        void deviceReportTamper({
          data: { token, detail: "Sali\xF3 de Nido m\xE1s de 15 s" }
        });
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [token]);
  useEffect(() => {
    if (sessionQuery.data?.child.locked && view === "browse") setView("home");
  }, [sessionQuery.data?.child.locked, view]);
  if (sessionQuery.isError) {
    clearDeviceToken();
    onUnpair();
    return null;
  }
  const session = sessionQuery.data;
  if (!session) {
    return /* @__PURE__ */ jsx("div", { className: "grid min-h-dvh place-items-center bg-bg", children: /* @__PURE__ */ jsx("div", { className: "h-16 w-16 animate-pulse rounded-full bg-surface-2" }) });
  }
  if (view === "pin") {
    return /* @__PURE__ */ jsx("main", { className: "grid min-h-dvh place-items-center bg-bg px-5", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        PinPad,
        {
          title: "PIN del padre",
          hint: "Para salir de este dispositivo",
          error: pinError,
          busy: pinBusy,
          onSubmit: async (pin) => {
            setPinError(null);
            setPinBusy(true);
            try {
              const res = await deviceVerifyPin({ data: { token, pin } });
              if (!res.ok) {
                setPinError(res.locked ? "Demasiados intentos. Espera 15 min." : "PIN incorrecto");
                return;
              }
              clearDeviceToken();
              onUnpair();
              await navigate("/app");
            } catch (e) {
              setPinError(e instanceof Error ? e.message : "Error");
            } finally {
              setPinBusy(false);
            }
          }
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "mt-6 block w-full text-center text-sm text-muted",
          onClick: () => setView("home"),
          children: "Cancelar"
        }
      )
    ] }) });
  }
  if (view === "browse") {
    return /* @__PURE__ */ jsx(
      SafeBrowser,
      {
        token,
        session,
        locked: session.child.locked,
        initialUrl: browseStart,
        onBack: () => setView("home")
      }
    );
  }
  const child = session.child;
  const locked = child.locked;
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto flex min-h-dvh max-w-md select-none flex-col px-5 py-6 overscroll-none", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(NestMark, { className: "size-8" }),
        /* @__PURE__ */ jsx("span", { className: "font-display text-lg font-semibold", children: child.name })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", className: "text-xs text-muted underline-offset-4 hover:underline", onClick: () => setView("pin"), children: "Salir" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 flex flex-col items-center", children: [
      child.lockReason === "paused" ? /* @__PURE__ */ jsx(Pause, { className: "size-10 text-primary" }) : null,
      child.lockReason === "bedtime" ? /* @__PURE__ */ jsx(Moon, { className: "size-10 text-primary" }) : null,
      /* @__PURE__ */ jsx(TimeRing, { remaining: child.remainingSeconds, total: Math.max(1, child.limitTodayMinutes) * 60, size: 200 }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-sm text-muted", children: lockCopy(child) }),
      /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-subtle", children: [
        "Semana: ",
        formatSeconds(child.remainingWeekSeconds),
        " libres de ",
        formatSeconds(child.weeklyMinutes * 60)
      ] })
    ] }),
    session.pendingRequest ? /* @__PURE__ */ jsxs("p", { className: "mt-6 rounded-lg bg-surface-2 px-4 py-3 text-center text-sm", children: [
      "Esperando respuesta del padre (",
      session.pendingRequest.minutes,
      " min)."
    ] }) : null,
    /* interruptor de accesibilidad dentro de la app */
    (typeof window.Android !== "undefined" && !accessibilityOn ? /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        onClick: () => {
          try {
            window.Android && window.Android.openAccessibilitySettings();
          } catch {}
        },
        className: "mt-6 w-full rounded-xl bg-surface-2 p-4 text-left shadow-[var(--shadow-card)]",
        children: /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-ink", children: "Dar permisos a Nido en Accesibilidad" })
      }
    ) : null),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid gap-2", children: [
      /* @__PURE__ */ jsxs(Button, { size: "lg", disabled: locked, onClick: () => {
        setBrowseStart("wikipedia.org");
        setView("browse");
      }, children: [
        /* @__PURE__ */ jsx(Globe, { className: "size-4" }),
        "Aplicaciones permitidas"
      ] }),
      child.lockReason !== "paused" ? /* @__PURE__ */ jsx(
        Button,
        {
          size: "lg",
          variant: locked ? "primary" : "outline",
          disabled: Boolean(session.pendingRequest),
          onClick: async () => {
            try {
              await deviceRequestTime({ data: { token, minutes: 15, reason: "Un rato m\xE1s" } });
              await queryClient.invalidateQueries({ queryKey: ["device-session", token] });
              toast.success("Petici\xF3n enviada al padre");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "No se pudo pedir");
            }
          },
          children: "Pedir 15 minutos"
        }
      ) : /* @__PURE__ */ jsx("p", { className: "px-2 text-center text-sm leading-relaxed text-muted", children: "Cuando tu padre pulse Reanudar en su tel\xE9fono, Nido vuelve a abrirse." })
    ] }),

    /* @__PURE__ */ jsxs("section", { className: "mt-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-sm font-medium text-muted", children: "Destinos permitidos" }),
      /* @__PURE__ */ jsx("ul", { className: "mt-3 grid grid-cols-2 gap-2", children: SAFE_DESTINATIONS.map((d) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          disabled: locked,
          onClick: () => {
            setBrowseStart(d.host);
            setView("browse");
          },
          className: "flex h-20 w-full flex-col items-start justify-center rounded-lg bg-surface px-3 text-left shadow-[var(--shadow-card)] disabled:opacity-40",
          children: [
            /* @__PURE__ */ jsx(BookOpen, { className: "size-4 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "mt-2 text-sm font-medium", children: d.name }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-subtle", children: d.hint })
          ]
        }
      ) }, d.host)) })
    ] })
  ] });
}
function lockCopy(child) {
  switch (child.lockReason) {
    case "paused":
      return "Tu padre paus\xF3 este dispositivo";
    case "bedtime":
      return `Hora de dormir \xB7 hasta las ${child.bedtimeEnd ?? "ma\xF1ana"}`;
    case "week":
      return "El cupo de esta semana se acab\xF3";
    case "time":
      return "Hoy el tiempo de pantalla se acab\xF3";
    default:
      return "Tiempo restante de hoy";
  }
}
function useChildKiosk(token) {
  useEffect(() => {
    document.body.classList.add("nido-kiosk");
    const href = `${window.location.pathname}${window.location.search}`;
    window.history.pushState({ nidoKiosk: 1 }, "", href);
    const onPop = () => {
      window.history.pushState({ nidoKiosk: 1 }, "", href);
      void deviceReportTamper({ data: { token, detail: "Intent\xF3 salir con el bot\xF3n atr\xE1s" } });
    };
    window.addEventListener("popstate", onPop);
    return () => {
      document.body.classList.remove("nido-kiosk");
      window.removeEventListener("popstate", onPop);
    };
  }, [token]);
}
export {
  DevicePage
};
