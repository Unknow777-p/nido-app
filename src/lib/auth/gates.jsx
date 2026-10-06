import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { signOut } from "./client";
import { useCurrentUser } from "./use-current-user";
const SIGN_IN_PATH = "/login";
function RedirectToSignIn({ to = SIGN_IN_PATH }) {
  return /* @__PURE__ */ jsx(Navigate, { to });
}
function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Cuenta";
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    user.profileImageUrl ? /* @__PURE__ */ jsx("img", { src: user.profileImageUrl, alt: "", className: "h-8 w-8 rounded-full object-cover" }) : /* @__PURE__ */ jsx("span", { className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium", children: label.charAt(0).toUpperCase() }),
    /* @__PURE__ */ jsx("span", { className: "hidden text-sm font-medium sm:inline", children: label }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        disabled: signingOut,
        onClick: () => {
          setSigningOut(true);
          void signOut().catch(() => setSigningOut(false));
        },
        className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
        children: signingOut ? "Saliendo\u2026" : "Salir"
      }
    )
  ] });
}
export {
  RedirectToSignIn,
  SIGN_IN_PATH,
  UserButton
};
