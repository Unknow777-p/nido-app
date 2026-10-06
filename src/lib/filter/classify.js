import {
  BLOCK_HOSTS,
  BLOCK_KEYWORDS,
  CATALOG_APPS,
  IMAGE_SEARCH_HINTS
} from "./catalog.js";
const CATEGORY_FLAG = {
  adult: "blockAdult",
  violence: "blockViolence",
  gambling: "blockGambling",
  drugs: "blockDrugs",
  hate: "blockHate",
  social: "blockSocial"
};
function normalizeHost(host) {
  return host.toLowerCase().replace(/^www\./, "");
}
function hostMatches(host, listed) {
  const h = normalizeHost(host);
  const l = normalizeHost(listed);
  return h === l || h.endsWith(`.${l}`);
}
function parseUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
}
function classifyUrl(raw, flags, blocked, allowed, appToggles = {}) {
  const url = parseUrl(raw);
  if (!url) {
    return {
      allowed: false,
      reason: "La direcci\xF3n no es v\xE1lida.",
      category: "unknown",
      host: ""
    };
  }
  const host = normalizeHost(url.hostname);
  const haystack = `${host}${url.pathname}${url.search}`.toLowerCase();
  if (allowed.some((h) => hostMatches(host, h))) {
    return {
      allowed: true,
      reason: "Sitio permitido por el tutor.",
      category: "safe",
      host
    };
  }
  if (blocked.some((h) => hostMatches(host, h))) {
    return {
      allowed: false,
      reason: "Este sitio est\xE1 en la lista bloqueada de la familia.",
      category: "custom",
      host
    };
  }
  for (const app of CATALOG_APPS) {
    if (app.hosts.some((h) => hostMatches(host, h))) {
      if (appToggles[app.id] === false) {
        return {
          allowed: false,
          reason: `${app.name} est\xE1 desactivado en el perfil.`,
          category: app.category,
          host
        };
      }
      if (app.category === "education") {
        return {
          allowed: true,
          reason: "Sitio educativo permitido.",
          category: "education",
          host
        };
      }
      const flag = CATEGORY_FLAG[app.category];
      if (flag && flags[flag]) {
        return {
          allowed: false,
          reason: `Bloqueado: ${labelFor(app.category)}.`,
          category: app.category,
          host
        };
      }
    }
  }
  for (const [category, hosts] of Object.entries(BLOCK_HOSTS)) {
    const flag = CATEGORY_FLAG[category];
    if (!flag || !flags[flag]) continue;
    if (hosts.some((h) => hostMatches(host, h))) {
      return {
        allowed: false,
        reason: `Bloqueado: ${labelFor(category)}.`,
        category,
        host
      };
    }
  }
  for (const [keyword, category] of Object.entries(BLOCK_KEYWORDS)) {
    const flag = CATEGORY_FLAG[category];
    if (!flag || !flags[flag]) continue;
    if (haystack.includes(keyword)) {
      return {
        allowed: false,
        reason: `Bloqueado: ${labelFor(category)}.`,
        category,
        host
      };
    }
  }
  if (flags.blockImageSearch && IMAGE_SEARCH_HINTS.some((hint) => haystack.includes(hint))) {
    return {
      allowed: false,
      reason: "La b\xFAsqueda de im\xE1genes est\xE1 restringida.",
      category: "adult",
      host
    };
  }
  let rewriteUrl;
  if (flags.forceSafeSearch || flags.blockAdult) {
    const kids = youtubeKidsUrl(host);
    if (kids) {
      return {
        allowed: true,
        reason: "YouTube se abre en YouTube Kids, con el cat\xE1logo filtrado.",
        category: "video",
        host,
        rewriteUrl: kids
      };
    }
  }
  if (flags.forceSafeSearch) {
    rewriteUrl = applySafeSearch(url) ?? void 0;
  }
  return {
    allowed: true,
    reason: rewriteUrl ? "Permitido con b\xFAsqueda segura." : "No coincide con las listas de riesgo.",
    category: "unknown",
    host,
    rewriteUrl
  };
}
function youtubeKidsUrl(host) {
  if (host.endsWith("youtube.com") || host === "youtu.be" || host.endsWith("youtubekids.com")) {
    return "https://www.youtubekids.com/";
  }
  return null;
}
function applySafeSearch(url) {
  const host = normalizeHost(url.hostname);
  if (host.endsWith("google.com") || host.endsWith("google.es") || host.endsWith("google.com.mx") || host.endsWith("google.com.ar")) {
    url.searchParams.set("safe", "active");
    return url.toString();
  }
  if (host.endsWith("bing.com")) {
    url.searchParams.set("adlt", "strict");
    return url.toString();
  }
  if (host.endsWith("duckduckgo.com")) {
    url.searchParams.set("kp", "1");
    return url.toString();
  }
  return null;
}
function labelFor(category) {
  switch (category) {
    case "adult":
      return "contenido sexual";
    case "violence":
      return "violencia gr\xE1fica";
    case "gambling":
      return "apuestas";
    case "drugs":
      return "drogas";
    case "hate":
      return "odio";
    case "social":
      return "redes sociales";
    case "education":
      return "educaci\xF3n";
    case "video":
      return "v\xEDdeo";
    case "games":
      return "juegos";
  }
}
export {
  classifyUrl
};
