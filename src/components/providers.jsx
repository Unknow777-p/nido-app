import { jsx, jsxs } from "react/jsx-runtime";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { InstallListener } from "@/components/install-nido";
function AppProviders({ children }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false }
      }
    })
  );
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client, children: [
    /* @__PURE__ */ jsx(InstallListener, {}),
    children,
    /* @__PURE__ */ jsx(
      Toaster,
      {
        position: "top-center",
        toastOptions: {
          className: "font-sans"
        }
      }
    )
  ] });
}
export {
  AppProviders
};
