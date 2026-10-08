import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InstallNido } from "@/components/install-nido";
import { PlanCard } from "@/components/plan-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clock, clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId, setActiveFamilyId } from "@/lib/family/active";
import { changePin, getFamily, renameFamily } from "@/lib/family/api";

function SettingsPage() {
  const queryClient = useQueryClient();
  const familyQuery = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() })
  });
  const [activeTab, setActiveTab] = useState("general");
  const [name, setName] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    if (familyQuery.data?.family.name) setName(familyQuery.data.family.name);
  }, [familyQuery.data?.family.name]);

  const rename = useMutation({
    mutationFn: () => renameFamily({ data: { name, familyId: getActiveFamilyId() ?? void 0 } }),
    onSuccess: () => {
      toast.success("Nombre actualizado");
      void queryClient.invalidateQueries({ queryKey: ["family"] });
    }
  });

  const pinMut = useMutation({
    mutationFn: () => changePin({ data: { currentPin, newPin, familyId: getActiveFamilyId() ?? void 0 } }),
    onSuccess: (res) => {
      if (!res.ok) {
        toast.error(res.locked ? "PIN bloqueado 15 minutos" : "PIN actual incorrecto");
        return;
      }
      toast.success("PIN cambiado");
      setCurrentPin("");
      setNewPin("");
    }
  });

  const tabs = [
    { id: "general", label: "Descripción general" },
    { id: "membresia", label: "Membresía" },
    { id: "seguridad", label: "Seguridad" },
    { id: "dispositivos", label: "Dispositivos" },
    { id: "perfiles", label: "Perfiles" }
  ];

  return /* @__PURE__ */ jsxs("div", { className: "flex rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsxs("aside", { className: "w-1/3 space-y-1 pr-4 border-r border-border", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app", className: "block text-sm font-medium hover:underline", children: "← Regresar" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-1", children: [
        tabs.map((item) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setActiveTab(item.id),
            className: "block w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-bg " + (activeTab === item.id ? "bg-bg text-ink" : ""),
            children: item.label
          },
          item.id
        ))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("main", { className: "w-2/3 pl-4 space-y-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-semibold tracking-tight", children: "Ajustes" }),

      activeTab === "general" ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: "fam", children: "Nombre de la familia" }),
        /* @__PURE__ */ jsx(Input, { id: "fam", value: name, onChange: (e) => setName(e.target.value) }),
        /* @__PURE__ */ jsx(Button, { type: "submit", onClick: () => rename.mutate(), children: "Guardar" }),
        /* @__PURE__ */ jsx("h2", { className: "pt-4 font-display text-xl font-semibold", children: "Perfil de usuario" }),
        /* @__PURE__ */ jsx(Label, { htmlFor: "profile-name", children: "Nombre completo" }),
        /* @__PURE__ */ jsx(Input, { id: "profile-name", placeholder: "Tu nombre", disabled: true }),
        /* @__PURE__ */ jsx(Label, { htmlFor: "profile-email", children: "Correo" }),
        /* @__PURE__ */ jsx(Input, { id: "profile-email", placeholder: "tu@correo.com", disabled: true })
      ] }) : null,

      activeTab === "membresia" ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx(PlanCard, {}),
        /* @__PURE__ */ jsx("h2", { className: "pt-4 font-display text-xl font-semibold", children: "Métodos de pago" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Sólo como ejemplo. No se aceptan pagos por ahora." }),
        /* @__PURE__ */ jsx(Button, { className: "mt-1", disabled: true, children: "Agregar tarjeta" })
      ] }) : null,

      activeTab === "seguridad" ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("form", { className: "space-y-3", onSubmit: (e) => { e.preventDefault(); pinMut.mutate(); }, children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Cambiar PIN" }),
          /* @__PURE__ */ jsx(Label, { htmlFor: "cur", children: "PIN actual" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "cur",
              inputMode: "numeric",
              value: currentPin,
              onChange: (e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6)),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(Label, { htmlFor: "np", children: "PIN nuevo" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "np",
              inputMode: "numeric",
              value: newPin,
              onChange: (e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)),
              autoComplete: "off"
            }
          ),
          /* @__PURE__ */ jsx(Button, { type: "submit", disabled: currentPin.length < 4 || newPin.length < 4, children: "Actualizar PIN" })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "pt-4 font-display text-xl font-semibold", children: "PIN de la app" }),
        /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "PIN actual", disabled: true }),
        /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "PIN nuevo", disabled: true }),
        /* @__PURE__ */ jsx(Button, { disabled: true, children: "Guardar PIN" }),
        /* @__PURE__ */ jsx("h2", { className: "pt-4 font-display text-xl font-semibold", children: "Seguridad" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted", children: "El PIN no es tu cuenta. Es la llave para salir del modo niño. Tras cinco intentos fallidos se bloquea un cuarto de hora. El código de vinculación es de un solo uso y caduca. Desde tu teléfono puedes pausar el dispositivo al instante: el niño no puede reanudarlo." })
      ] }) : null,

      activeTab === "dispositivos" ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Dispositivos" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Aquí están las tabletas de los niños." }),
        Array.isArray(familyQuery.data?.children) && familyQuery.data.children.map((child) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]",
            children: [
              /* @__PURE__ */ jsx("p", { className: "font-medium", children: child.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: child.devicePaired ? (child.deviceName || "Dispositivo vinculado") : "Sin dispositivo" }),
              child.online ? /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-ok", children: "En línea" }) : null
            ]
          },
          child.id
        ))
      ] }) : null,

      activeTab === "perfiles" ? /* @__PURE__ */ jsxs("section", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Perfiles" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Aquí puedes añadir más niños/as o gestionar sus perfiles." }),
        /* @__PURE__ */ jsx(Button, { asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/app", children: "Ver dashboard" }) })
      ] }) : null
    ] })
  ] });
}

export {
  SettingsPage
};
