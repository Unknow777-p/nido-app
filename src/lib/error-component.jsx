import { jsx, jsxs } from "react/jsx-runtime";
import { Component } from "react";
import { TriangleAlert } from "lucide-react";
function AppErrorComponent({ error }) {
  const message = error instanceof Error ? error.message : "Error inesperado. Recarga la p\xE1gina.";
  return /* @__PURE__ */ jsxs("main", { className: "flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-ink", children: [
    /* @__PURE__ */ jsx("span", { className: "text-danger", "aria-hidden": "true", children: /* @__PURE__ */ jsx(TriangleAlert, { className: "size-10", strokeWidth: 2 }) }),
    /* @__PURE__ */ jsx("h1", { className: "font-display text-lg font-semibold", children: "Algo no funcion\xF3" }),
    /* @__PURE__ */ jsx("p", { className: "max-w-md text-sm break-words text-muted", children: message || "Error inesperado. Recarga la p\xE1gina." })
  ] });
}
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }
  render() {
    return this.state.error ? /* @__PURE__ */ jsx(AppErrorComponent, { error: this.state.error }) : this.props.children;
  }
}
export {
  AppErrorComponent,
  ErrorBoundary
};
