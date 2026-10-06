import { jsx, jsxs } from "react/jsx-runtime";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AGE_BANDS } from "@/lib/filter/catalog";
import { clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId, setActiveFamilyId } from "@/lib/family/active";
import { createFamily, getFamily } from "@/lib/family/api";
import { PinPad } from "@/components/pin-pad";
import { Wordmark } from "@/components/mark";
import { Splash } from "@/components/splash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
function Onboarding() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const nueva = searchParams.get("nueva") === "1";
  const existing = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() }),
    enabled: Boolean(user)
  });
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState("Casa");
  const [childName, setChildName] = useState("");
  const [ageBand, setAgeBand] = useState("10-12");
  const [pinDraft, setPinDraft] = useState("");
  const [error, setError] = useState(null);
  const mutate = useMutation({
    mutationFn: (pin) => createFamily({
      data: { familyName, pin, childName, ageBand }
    }),
    onSuccess: async (res) => {
      if (res?.familyId) setActiveFamilyId(res.familyId);
      await queryClient.invalidateQueries();
      await navigate("/app");
    },
    onError: (err) => setError(err.message)
  });
  if (isPending) return /* @__PURE__ */ jsx(Splash, {});
  if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
  if (existing.data && !nueva) return /* @__PURE__ */ jsx(Navigate, { to: "/app" });
  if (step === 2) {
    return /* @__PURE__ */ jsx("main", { className: "mx-auto grid min-h-dvh max-w-md place-items-center px-5 py-8", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Wordmark, {}),
      /* @__PURE__ */ jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsx(
        PinPad,
        {
          title: "Elige el PIN del tutor",
          hint: "4 a 6 d\xEDgitos. Lo usar\xE1s para salir del modo ni\xF1o.",
          error,
          onSubmit: (pin) => {
            setError(null);
            setPinDraft(pin);
            setStep(3);
          }
        }
      ) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "mt-6 block w-full text-center text-sm text-muted",
          onClick: () => setStep(1),
          children: "Volver"
        }
      )
    ] }) });
  }
  if (step === 3) {
    return /* @__PURE__ */ jsx("main", { className: "mx-auto grid min-h-dvh max-w-md place-items-center px-5 py-8", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(Wordmark, {}),
      /* @__PURE__ */ jsx("div", { className: "mt-10", children: /* @__PURE__ */ jsx(
        PinPad,
        {
          title: "Repite el PIN",
          hint: "As\xED evitas un error que luego no puedas deshacer en la tablet.",
          error,
          busy: mutate.isPending,
          onSubmit: (pin) => {
            if (pin !== pinDraft) {
              setError("No coinciden. Vuelve a escribirlo.");
              return;
            }
            setError(null);
            mutate.mutate(pin);
          }
        }
      ) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "mt-6 block w-full text-center text-sm text-muted",
          onClick: () => {
            setError(null);
            setPinDraft("");
            setStep(2);
          },
          children: "Elegir otro PIN"
        }
      )
    ] }) });
  }
  return /* @__PURE__ */ jsxs("main", { className: "mx-auto min-h-dvh max-w-md px-5 py-8", children: [
    /* @__PURE__ */ jsx(Wordmark, {}),
    /* @__PURE__ */ jsx("h1", { className: "mt-8 font-display text-3xl font-semibold tracking-tight", children: "Prepara el nido" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted", children: "Nombre de la casa, el primer perfil y un PIN que solo t\xFA conoces." }),
    /* @__PURE__ */ jsxs(
      "form",
      {
        className: "mt-8 space-y-5",
        onSubmit: (e) => {
          e.preventDefault();
          setError(null);
          setStep(2);
        },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "family", children: "Nombre de la familia" }),
            /* @__PURE__ */ jsx(Input, { id: "family", value: familyName, onChange: (e) => setFamilyName(e.target.value), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "child", children: "Nombre del ni\xF1o o adolescente" }),
            /* @__PURE__ */ jsx(Input, { id: "child", value: childName, onChange: (e) => setChildName(e.target.value), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { children: "Edad" }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: AGE_BANDS.map((band) => /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setAgeBand(band.id),
                className: cn(
                  "rounded-lg px-3 py-3 text-left text-sm shadow-[var(--shadow-card)]",
                  ageBand === band.id ? "bg-primary text-primary-fg" : "bg-surface text-ink"
                ),
                children: [
                  /* @__PURE__ */ jsx("span", { className: "block font-medium", children: band.label }),
                  /* @__PURE__ */ jsxs("span", { className: cn("mt-1 block text-xs", ageBand === band.id ? "text-primary-fg/80" : "text-muted"), children: [
                    band.daily,
                    " min / d\xEDa"
                  ] })
                ]
              },
              band.id
            )) })
          ] }),
          error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-danger", children: error }) : null,
          /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: childName.trim().length < 1, children: "Continuar al PIN" })
        ]
      }
    )
  ] });
}
export {
  Onboarding
};
