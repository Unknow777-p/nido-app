import { authClient } from "./client";
function useCurrentUserState() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  return {
    user: user ? {
      id: user.id,
      displayName: user.name ?? null,
      primaryEmail: user.email ?? null,
      profileImageUrl: user.image ?? null
    } : null,
    isPending
  };
}
function useCurrentUser() {
  return useCurrentUserState().user;
}
export {
  useCurrentUser,
  useCurrentUserState
};
