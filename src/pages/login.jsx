import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Wordmark } from "@/components/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
function Login() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [mode, setMode] = useState("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  if (!isPending && user) {
    return /* @__PURE__ */ jsx(Navigate, { to: "/" });
  }
  async function onEmail(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || "Tutor" });
        if (res.error) throw new Error(res.error.message || "No se pudo crear la cuenta.");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || "Correo o contrase\xF1a no v\xE1lidos.");
      }
      await navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al entrar.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsx("main", { className: "grid min-h-dvh place-items-center px-5 py-10", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-flex", children: /* @__PURE__ */ jsx(Wordmark, {}) }),
    /* @__PURE__ */ jsx("h1", { className: "mt-8 font-display text-3xl font-semibold tracking-tight", children: "Entrar como tutor" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted", children: "Usa la misma cuenta en tu tel\xE9fono para vigilar el tiempo." }),
    isPending ? /* @__PURE__ */ jsx("div", { className: "mt-8 h-40 animate-pulse rounded-lg bg-surface-2" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("form", { className: "space-y-3", onSubmit: onEmail, children: [
        mode === "up" ? /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "name", children: "Tu nombre" }),
          /* @__PURE__ */ jsx(Input, { id: "name", value: name, onChange: (e) => setName(e.target.value), autoComplete: "name" })
        ] }) : null,
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "email", children: "Correo" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "email",
              type: "email",
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
              autoComplete: "email"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: "password", children: "Contrase\xF1a" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              id: "password",
              type: "password",
              required: true,
              minLength: 8,
              value: password,
              onChange: (e) => setPassword(e.target.value),
              autoComplete: mode === "up" ? "new-password" : "current-password"
            }
          )
        ] }),
        error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-danger", children: error }) : null,
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: busy, children: mode === "up" ? "Crear cuenta" : "Entrar" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "mt-4 text-sm text-muted underline-offset-4 hover:underline",
          onClick: () => setMode(mode === "up" ? "in" : "up"),
          children: mode === "up" ? "Ya tengo cuenta" : "Crear cuenta con correo"
        }
      )
    ] })
  ] }) });
}
export {
  Login
};
