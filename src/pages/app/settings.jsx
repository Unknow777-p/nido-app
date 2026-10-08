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
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-md space-y-8", children: [
    /* @__PURE__ */ jsx("h1", { className: "font-display text-3xl font-semibold tracking-tight", children: "Ajustes" }),
    /* @__PURE__ */ jsx(PlanCard, {}),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "space-y-3",
        onSubmit: (e) => {
          e.preventDefault();
          rename.mutate();
        },
        children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "fam", children: "Nombre de la familia" }),
          /* @__PURE__ */ jsx(Input, { id: "fam", value: name, onChange: (e) => setName(e.target.value) }),
          /* @__PURE__ */ jsx(Button, { type: "submit", children: "Guardar" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "space-y-3",
        onSubmit: (e) => {
          e.preventDefault();
          pinMut.mutate();
        },
        children: [
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
        ]
      }
    ),
    /* Perfil de usuario */
    /* @__PURE__ */ jsxs(
      "section",
      {
        className: "space-y-3",
        children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Perfil de usuario" }),
          /* @__PURE__ */ jsx(Label, { htmlFor: "profile-name", children: "Nombre completo" }),
          /* @__PURE__ */ jsx(Input, { id: "profile-name", placeholder: "Tu nombre", disabled: true }),
          /* @__PURE__ */ jsx(Label, { htmlFor: "profile-email", children: "Correo" }),
          /* @__PURE__ */ jsx(Input, { id: "profile-email", placeholder: "tu@correo.com", disabled: true }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-medium", children: "Métodos de pago" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-muted", children: "Sólo como ejemplo. No se aceptan pagos por ahora." }),
          /* @__PURE__ */ jsx(Button, { className: "mt-1", disabled: true, children: "Agregar tarjeta" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-medium", children: "Cambiar contraseña" }),
          /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "Contraseña actual", disabled: true }),
          /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "Contraseña nueva", disabled: true }),
          /* @__PURE__ */ jsx(Button, { disabled: true, children: "Cambiar contraseña" }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-medium", children: "PIN de la app" }),
          /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "PIN actual", disabled: true }),
          /* @__PURE__ */ jsx(Input, { type: "password", placeholder: "PIN nuevo", disabled: true }),
          /* @__PURE__ */ jsx(Button, { disabled: true, children: "Guardar PIN" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(InstallNido, { audience: "family" }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Ayuda" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted", children: "Si el ni\xF1o sale de Nido, inst\xE1lala en la pantalla de inicio de la tablet. PIN olvidado: entra con el correo de tutor y c\xE1mbialo aqu\xED. C\xF3digo caducado: genera otro en el perfil del hijo." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted", children: "El cobro es $3.99 al mes por familia, con tarjeta. El soporte de cada cuenta lo da quien publica Nido." })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "font-display text-xl font-semibold", children: "Seguridad" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted", children: "El PIN no es tu cuenta. Es la llave para salir del modo ni\xF1o. Tras cinco intentos fallidos se bloquea un cuarto de hora. El c\xF3digo de vinculaci\xF3n es de un solo uso y caduca. Desde tu tel\xE9fono puedes pausar el dispositivo al instante: el ni\xF1o no puede reanudarlo." }),
    ] })
  ] });
}
export {
  SettingsPage
};
