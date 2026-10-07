import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Check, Download, Share, Smartphone, SquarePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  detectInstallPlatform,
  isStandaloneDisplay,
  useInstallStore
} from "@/lib/install";
import { cn } from "@/lib/utils";
function InstallNido({
  variant = "full",
  audience = "family",
  className
}) {
  const deferred = useInstallStore((s) => s.deferred);
  const standalone = useInstallStore((s) => s.standalone);
  const [platform, setPlatform] = useState("desktop");
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setPlatform(detectInstallPlatform());
  }, []);
  if (hidden) return null;
  if (standalone) {
    if (variant === "compact") return null;
    return /* @__PURE__ */ jsx("section", { className: cn("rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]", className), children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg", children: /* @__PURE__ */ jsx(Check, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: "Nido est\xE1 en este aparato" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted", children: "Se descarga la app de Nido como APK. El tutor sigue viendo el tiempo desde su teléfono." })
      ] })
    ] }) });
  }
  const title = audience === "device" ? "F\xEDjala en la pantalla de inicio" : "Instalar en el tel\xE9fono o tablet";
  const lead = audience === "device" ? "As\xED Nido se abre a pantalla completa y cuesta m\xE1s salir. Tarda menos de un minuto." : "En el aparato del ni\xF1o: inst\xE1lala y luego vinc\xFAlala con el c\xF3digo. En el tuyo, tambi\xE9n, para vigilar el tiempo.";
  async function installNow() {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        useInstallStore.getState().setDeferred(null);
        toast.success("Nido qued\xF3 en la pantalla de inicio");
      }
    } catch {
      toast.error("No se pudo instalar. Usa los pasos de abajo.");
    } finally {
      setBusy(false);
    }
  }
  if (variant === "compact") {
    return /* @__PURE__ */ jsx("section", { className: cn("rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", className), children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(Smartphone, { className: "mt-0.5 size-5 shrink-0 text-primary" }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted", children: lead }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/nido-debug.apk", download: true, children: [
            /* @__PURE__ */ jsx(Download, { className: "size-4" }),
            "Descargar APK"
          ] }) }),
          audience === "family" ? /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "h-9 px-2 text-sm text-muted underline-offset-4 hover:underline",
              onClick: () => setHidden(true),
              children: "Ahora no"
            }
          ) : null
        ] }),
        open && !deferred ? /* @__PURE__ */ jsx("div", { className: "mt-4", children: platform === "desktop" ? /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(StepsCard, { platform: "android" }),
          /* @__PURE__ */ jsx(StepsCard, { platform: "ios" })
        ] }) : /* @__PURE__ */ jsx(StepsCard, { platform }) }) : null
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("section", { className: cn("rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("span", { className: "grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-fg", children: /* @__PURE__ */ jsx(Download, { className: "size-5" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold tracking-tight", children: title }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted", children: lead })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { className: "mt-5 w-full", size: "lg", asChild: true, children: /* @__PURE__ */ jsx("a", { href: "/nido-debug.apk", download: true, children: [
      /* @__PURE__ */ jsx(Download, { className: "size-4" }),
      "Descargar APK"
    ] }) }),
    platform === "desktop" ? /* @__PURE__ */ jsxs("div", { className: "mt-5 grid gap-3 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsx(StepsCard, { platform: "android" }),
      /* @__PURE__ */ jsx(StepsCard, { platform: "ios" })
    ] }) : /* @__PURE__ */ jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsx(StepsCard, { platform }) }),
    /* @__PURE__ */ jsx("p", { className: "mt-4 text-xs leading-relaxed text-subtle", children: "No sustituye ninguna otra herramienta de control parental. Nido cubre el cupo, el filtro, el PIN y lo que ves en tu teléfono, directamente en la app." })
  ] });
}
function StepsCard({ platform }) {
  const ios = platform === "ios";
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-bg p-4", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: ios ? "iPhone o iPad \xB7 Safari" : "Android \xB7 Chrome" }),
    /* @__PURE__ */ jsx("ol", { className: "mt-3 space-y-3", children: (ios ? [
      { icon: Smartphone, text: "Abre Nido en Safari, no en Chrome." },
      { icon: Share, text: "Pulsa Compartir, el cuadrado con la flecha." },
      { icon: SquarePlus, text: "Elige A\xF1adir a pantalla de inicio y confirma." }
    ] : [
      { icon: Smartphone, text: "En tu Android, abre Nido y pulsa Descargar APK." },
      { icon: Share, text: "Permite instalar apps de fuentes desconocidas si te lo pide." },
      { icon: SquarePlus, text: "Abre el APK descargado y pulsa Instalar." }
    ]).map((step, i) => /* @__PURE__ */ jsxs("li", { className: "flex gap-3 text-sm leading-relaxed text-muted", children: [
      /* @__PURE__ */ jsx("span", { className: "grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-ink", children: i + 1 }),
      /* @__PURE__ */ jsxs("span", { className: "flex items-start gap-2 pt-1", children: [
        /* @__PURE__ */ jsx(step.icon, { className: "mt-0.5 size-4 shrink-0 text-primary" }),
        step.text
      ] })
    ] }, step.text)) }),
    ios ? /* @__PURE__ */ jsx(
      "a",
      {
        href: "/instalar",
        className: "mt-4 inline-block text-sm text-moss underline-offset-4 hover:underline",
        children: "Gu\xEDa con fotos"
      }
    ) : null
  ] });
}
function InstallListener() {
  const setDeferred = useInstallStore((s) => s.setDeferred);
  const setStandalone = useInstallStore((s) => s.setStandalone);
  useEffect(() => {
    setStandalone(isStandaloneDisplay());
    const onPrompt = (event) => {
      event.preventDefault();
      setDeferred(event);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setStandalone(isStandaloneDisplay());
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onMq);
    };
  }, [setDeferred, setStandalone]);
  return null;
}
export {
  InstallListener,
  InstallNido
};
