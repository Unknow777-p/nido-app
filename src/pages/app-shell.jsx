import { jsx, jsxs } from "react/jsx-runtime";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { House, Settings } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId } from "@/lib/family/active";
import { getFamily } from "@/lib/family/api";
import { Wordmark } from "@/components/mark";
import { Splash } from "@/components/splash";
import { cn } from "@/lib/utils";
function AppShell() {
  const { user, isPending } = useCurrentUserState();
  const familyQuery = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() }),
    enabled: Boolean(user),
    refetchInterval: 12e3
  });
  const navigate = useNavigate();
  if (isPending) return /* @__PURE__ */ jsx(Splash, {});
  if (!user) return /* @__PURE__ */ jsx(RedirectToSignIn, {});
  if (familyQuery.isPending) return /* @__PURE__ */ jsx(Splash, {});
  if (!familyQuery.data) {
    void navigate("/onboarding");
    return /* @__PURE__ */ jsx(Splash, {});
  }
  return /* @__PURE__ */ jsxs("div", { className: "min-h-dvh bg-bg pb-24 md:pb-0", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-20 border-b border-border/80 bg-bg/90 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx(Link, { to: "/app", className: "min-w-0", children: /* @__PURE__ */ jsx(Wordmark, {}) }),
      /* @__PURE__ */ jsxs("nav", { className: "hidden items-center gap-1 md:flex", children: [
        /* @__PURE__ */ jsx(
          NavLink,
          {
            to: "/app",
            end: true,
            className: ({ isActive }) => cn("rounded-md px-3 py-2 text-sm text-muted hover:text-ink", isActive && "text-ink"),
            children: "Inicio"
          }
        ),
        /* @__PURE__ */ jsx(
          NavLink,
          {
            to: "/app/ajustes",
            className: ({ isActive }) => cn("rounded-md px-3 py-2 text-sm text-muted hover:text-ink", isActive && "text-ink"),
            children: "Ajustes"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
        /* @__PURE__ */ jsx(UserButton, {})
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-5xl px-4 py-6", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx("nav", { className: "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto grid max-w-md grid-cols-2", children: [
      /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: "/app",
          end: true,
          className: ({ isActive }) => cn("flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted", isActive && "text-primary"),
          children: [
            /* @__PURE__ */ jsx(House, { className: "size-5" }),
            "Inicio"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: "/app/ajustes",
          className: ({ isActive }) => cn("flex h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted", isActive && "text-primary"),
          children: [
            /* @__PURE__ */ jsx(Settings, { className: "size-5" }),
            "Ajustes"
          ]
        }
      )
    ] }) })
  ] });
}
export {
  AppShell
};
