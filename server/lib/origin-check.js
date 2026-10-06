function sameSite(req) {
  const site = req.headers["sec-fetch-site"];
  if (site && site !== "same-origin" && site !== "same-site" && site !== "none") return false;
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const o = new URL(origin).host;
    const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim();
    const loopback = (h) => /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(h);
    return o === host || loopback(o) && loopback(host);
  } catch {
    return false;
  }
}
export {
  sameSite
};
