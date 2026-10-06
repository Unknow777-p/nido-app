import { jsx } from "react/jsx-runtime";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Landing } from "@/components/landing";
import { Splash } from "@/components/splash";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { clockFamily } from "@/lib/family/clock";
import { getActiveFamilyId } from "@/lib/family/active";
import { getFamily } from "@/lib/family/api";
function Home() {
  const { user, isPending } = useCurrentUserState();
  const signedIn = Boolean(user);
  const familyQuery = useQuery({
    queryKey: ["family", getActiveFamilyId()],
    queryFn: () => getFamily({ data: clockFamily() }),
    enabled: signedIn,
    retry: 1
  });
  if (!signedIn) {
    if (isPending) return /* @__PURE__ */ jsx(Splash, {});
    return /* @__PURE__ */ jsx(Landing, {});
  }
  if (familyQuery.isPending) return /* @__PURE__ */ jsx(Splash, {});
  if (familyQuery.data) return /* @__PURE__ */ jsx(Navigate, { to: "/app" });
  return /* @__PURE__ */ jsx(Navigate, { to: "/onboarding" });
}
export {
  Home
};
