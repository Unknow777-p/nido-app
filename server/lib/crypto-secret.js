import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
function newId() {
  return crypto.randomUUID();
}
function newPairingCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
function newPairingToken() {
  return randomBytes(32).toString("hex");
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function hashSecret(secret) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${sha256(`${salt}:${secret}`)}`;
}
function verifySecret(secret, stored) {
  const sep = stored.indexOf(":");
  if (sep < 0) return false;
  const salt = stored.slice(0, sep);
  const expected = stored.slice(sep + 1);
  const actual = sha256(`${salt}:${secret}`);
  if (actual.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}
function hashToken(token) {
  return sha256(token);
}
export {
  hashSecret,
  hashToken,
  newId,
  newPairingCode,
  newPairingToken,
  verifySecret
};
