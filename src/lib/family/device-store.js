const KEY = "nido.device.v1";
function readDeviceToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function writeDeviceToken(token) {
  localStorage.setItem(KEY, token);
}
function clearDeviceToken() {
  localStorage.removeItem(KEY);
}
export {
  clearDeviceToken,
  readDeviceToken,
  writeDeviceToken
};
