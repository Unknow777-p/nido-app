const KEY = "nido_active_family";
function getActiveFamilyId() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}
function setActiveFamilyId(id) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
  }
}
export {
  getActiveFamilyId,
  setActiveFamilyId
};
