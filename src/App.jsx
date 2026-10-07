import { jsx, jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppProviders } from "@/components/providers";
import { ErrorBoundary } from "@/lib/error-component";
import { Home } from "@/pages/home";
import { Login } from "@/pages/login";
import { Onboarding } from "@/pages/onboarding";
import { InstallPage } from "@/pages/instalar";
import { DevicePage } from "@/pages/dispositivo";
import { AppShell } from "@/pages/app-shell";
import { Dashboard } from "@/pages/app/dashboard";
import { ChildDetailPage } from "@/pages/app/child";
import { SettingsPage } from "@/pages/app/settings";
function App() {
  return /* @__PURE__ */ jsx(ErrorBoundary, { children: /* @__PURE__ */ jsx(AppProviders, { children: /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { path: "/", element: /* @__PURE__ */ jsx(Home, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/login", element: /* @__PURE__ */ jsx(Login, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/onboarding", element: /* @__PURE__ */ jsx(Onboarding, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/dispositivo", element: /* @__PURE__ */ jsx(DevicePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "/instalar", element: /* @__PURE__ */ jsx(InstallPage, {}) }),
    /* @__PURE__ */ jsxs(Route, { path: "/app", element: /* @__PURE__ */ jsx(AppShell, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(Dashboard, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "ajustes", element: /* @__PURE__ */ jsx(SettingsPage, {}) }),
      /* @__PURE__ */ jsx(Route, { path: ":childId", element: /* @__PURE__ */ jsx(ChildDetailPage, {}) })
    ] }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Navigate, { to: "/", replace: true }) })
  ] }) }) });
}
export {
  App as default
};
