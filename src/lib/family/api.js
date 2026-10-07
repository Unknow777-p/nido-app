async function call(name, data) {
  const res = await fetch(`/api/rpc/${name}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data })
  });
  let payload = {};
  try {
    payload = await res.json();
  } catch {
  }
  if (!res.ok) throw new Error(payload.error || `Error ${res.status}`);
  return payload.result;
}
const api = new Proxy({}, {
  get: (_target, name) => (opts) => call(String(name), opts?.data)
});
const {
  getFamily,
  createFamily,
  addChild,
  getChildDetail,
  updateChild,
  setDayLimits,
  updateFilters,
  setAppToggle,
  addSite,
  removeSite,
  createPairingCode,
  revokeDevice,
  grantExtraTime,
  revokeExtraTime,
  setChildPaused,
  setSystemGuard,
  respondTimeRequest,
  verifyFamilyPin,
  changePin,
  renameFamily,
  startCheckout,
  openBillingPortal,
  listPayments,
  pairDevice,
  deviceSession,
  deviceHeartbeat,
  deviceClassify,
  deviceRequestTime,
  deviceVerifyPin,
  deviceReportTamper,
  parentOpenChildDevice,
  parentClassify
} = api;
export {
  addChild,
  addSite,
  changePin,
  createFamily,
  createPairingCode,
  deviceClassify,
  deviceHeartbeat,
  deviceReportTamper,
  deviceRequestTime,
  deviceSession,
  deviceVerifyPin,
  getChildDetail,
  getFamily,
  grantExtraTime,
  revokeExtraTime,
  listPayments,
  openBillingPortal,
  pairDevice,
  parentClassify,
  parentOpenChildDevice,
  removeSite,
  renameFamily,
  respondTimeRequest,
  revokeDevice,
  setAppToggle,
  setChildPaused,
  setDayLimits,
  setSystemGuard,
  startCheckout,
  updateChild,
  updateFilters,
  verifyFamilyPin
};
