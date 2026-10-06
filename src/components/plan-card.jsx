import { jsx, jsxs } from "react/jsx-runtime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { planHeadline } from "@/lib/family/billing";
import { clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId } from "@/lib/family/active";
import { getFamily, listPayments, openBillingPortal, startCheckout } from "@/lib/family/api";
function paidDate(iso) {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}
function PlanCard() {
  const queryClient = useQueryClient();
  const familyQuery = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() })
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments", getActiveFamilyId()],
    queryFn: () => listPayments({ data: { familyId: getActiveFamilyId() ?? void 0 } })
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      toast.success("Pago recibido. El plan queda activo.");
      void queryClient.invalidateQueries({ queryKey: ["family"] });
      void queryClient.invalidateQueries({ queryKey: ["payments"] });
      window.history.replaceState({}, "", "/app/ajustes");
    }
    if (params.get("paid") === "0") {
      toast.message("Pago cancelado. Puedes intentarlo cuando quieras.");
      window.history.replaceState({}, "", "/app/ajustes");
    }
  }, [queryClient]);
  const pay = useMutation({
    mutationFn: () => startCheckout(),
    onSuccess: (res) => {
      if (res.ok) {
        window.location.assign(res.url);
        return;
      }
      if (res.reason === "not_configured") {
        toast.message("Durante la prueba no se cobra. El pago con tarjeta se abre al publicar Nido con cobro conectado.");
        return;
      }
      toast.error("No se pudo abrir el pago. Prueba de nuevo.");
    },
    onError: (err) => toast.error(err.message)
  });
  const portal = useMutation({
    mutationFn: () => openBillingPortal(),
    onSuccess: (res) => {
      if (res.ok) {
        window.location.assign(res.url);
        return;
      }
      toast.message("Cuando el cobro est\xE9 activo, aqu\xED podr\xE1s cambiar la tarjeta o cancelar.");
    },
    onError: (err) => toast.error(err.message)
  });
  const data = familyQuery.data;
  if (!data) return null;
  const plan = data.plan;
  return /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-surface p-5 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium uppercase tracking-[0.14em] text-moss", children: "Plan familiar" }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2 flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl font-semibold tracking-tight", children: "Nido" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted", children: planHeadline(plan) })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "font-display text-3xl font-semibold tracking-tight", children: [
        plan.priceLabel,
        /* @__PURE__ */ jsx("span", { className: "ml-1 text-base font-normal text-muted", children: "/ mes" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: "mt-4 space-y-2 text-sm leading-relaxed text-muted", children: [
      /* @__PURE__ */ jsx("li", { children: "Una familia, hasta 6 perfiles. Cada hijo con su cupo y filtros." }),
      /* @__PURE__ */ jsx("li", { children: "Pagas con tarjeta (Visa, Mastercard y similares). Un cargo al mes." }),
      /* @__PURE__ */ jsxs("li", { children: [
        "30 d\xEDas de prueba al crear la familia. Luego ",
        plan.priceLabel,
        " al mes."
      ] })
    ] }),
    plan.status === "active" ? /* @__PURE__ */ jsxs("div", { className: "mt-5 space-y-3", children: [
      /* @__PURE__ */ jsxs("p", { className: "inline-flex items-center gap-2 text-sm font-medium text-primary", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "size-4" }),
        "Suscripci\xF3n activa"
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          className: "w-full",
          variant: "secondary",
          onClick: () => portal.mutate(),
          disabled: portal.isPending,
          children: portal.isPending ? "Abriendo\u2026" : "Tarjeta o cancelar"
        }
      )
    ] }) : /* @__PURE__ */ jsxs(Button, { className: "mt-5 w-full", onClick: () => pay.mutate(), disabled: pay.isPending, children: [
      /* @__PURE__ */ jsx(CreditCard, { className: "size-4" }),
      pay.isPending ? "Abriendo pago\u2026" : `Pagar ${plan.priceLabel} / mes`
    ] }),
    !data.checkoutReady ? /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm leading-relaxed text-muted", children: "Ahora mismo no se cobra nada: cada familia tiene 30 d\xEDas de prueba. El pago con tarjeta se activa cuando el cobro de Nido est\xE9 conectado." }) : null,
    (paymentsQuery.data?.length ?? 0) > 0 ? /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-1 border-t border-border/80 pt-3 text-sm text-muted", children: paymentsQuery.data?.map((row) => /* @__PURE__ */ jsxs("li", { className: "flex justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        "Mes de Nido \xB7 ",
        paidDate(row.createdAt)
      ] }),
      /* @__PURE__ */ jsx("span", { children: "$3.99" })
    ] }, row.id)) }) : null
  ] });
}
function PlanBanner({ plan, onPay }) {
  if (plan.status === "active") return null;
  return /* @__PURE__ */ jsxs("section", { className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-card)]", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: planHeadline(plan) }),
    /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm leading-relaxed text-muted", children: plan.status === "expired" ? "Para a\xF1adir perfiles y seguir el plan, activa Nido por $3.99 al mes. Se paga con tarjeta." : "Despu\xE9s de la prueba, $3.99 al mes por familia. Se paga con tarjeta." }),
    onPay ? /* @__PURE__ */ jsx(Button, { className: "mt-3", size: "sm", onClick: onPay, children: plan.status === "expired" ? "Activar plan" : "Ver plan" }) : null
  ] });
}
export {
  PlanBanner,
  PlanCard
};
