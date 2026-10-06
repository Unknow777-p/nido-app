import { createAuthClient } from "better-auth/react";
const authClient = createAuthClient();
async function signOut() {
  await authClient.signOut();
  window.location.assign("/");
}
export {
  authClient,
  signOut
};
