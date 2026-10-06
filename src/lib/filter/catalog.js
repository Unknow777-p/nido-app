const CATALOG_APPS = [
  {
    id: "youtube",
    name: "YouTube",
    hosts: ["youtube.com", "youtu.be", "m.youtube.com"],
    category: "video",
    description: "V\xEDdeo. Se fuerza el modo restringido si el filtro est\xE1 activo."
  },
  {
    id: "tiktok",
    name: "TikTok",
    hosts: ["tiktok.com", "vm.tiktok.com"],
    category: "social",
    description: "Red corta. Bloqueada por defecto en menores de 13."
  },
  {
    id: "instagram",
    name: "Instagram",
    hosts: ["instagram.com"],
    category: "social",
    description: "Fotos y reels."
  },
  {
    id: "snapchat",
    name: "Snapchat",
    hosts: ["snapchat.com"],
    category: "social",
    description: "Mensajes que desaparecen."
  },
  {
    id: "discord",
    name: "Discord",
    hosts: ["discord.com", "discord.gg"],
    category: "social",
    description: "Chats y servidores. Alto contacto con extra\xF1os."
  },
  {
    id: "x",
    name: "X",
    hosts: ["x.com", "twitter.com", "t.co"],
    category: "social",
    description: "Red p\xFAblica, contenido sin filtrar."
  },
  {
    id: "reddit",
    name: "Reddit",
    hosts: ["reddit.com"],
    category: "social",
    description: "Foros abiertos."
  },
  {
    id: "facebook",
    name: "Facebook",
    hosts: ["facebook.com", "fb.com", "messenger.com"],
    category: "social",
    description: "Red social y Messenger."
  },
  {
    id: "whatsapp",
    name: "WhatsApp Web",
    hosts: ["web.whatsapp.com", "whatsapp.com"],
    category: "social",
    description: "Mensajer\xEDa."
  },
  {
    id: "twitch",
    name: "Twitch",
    hosts: ["twitch.tv"],
    category: "video",
    description: "Directos. Chat abierto."
  },
  {
    id: "netflix",
    name: "Netflix",
    hosts: ["netflix.com"],
    category: "video",
    description: "Series y pel\xEDculas."
  },
  {
    id: "roblox",
    name: "Roblox",
    hosts: ["roblox.com"],
    category: "games",
    description: "Juegos con chat."
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    hosts: ["wikipedia.org"],
    category: "education",
    description: "Consulta. Siempre permitida."
  },
  {
    id: "khan",
    name: "Khan Academy",
    hosts: ["khanacademy.org"],
    category: "education",
    description: "Clases y ejercicios."
  },
  {
    id: "scratch",
    name: "Scratch",
    hosts: ["scratch.mit.edu"],
    category: "education",
    description: "Programar con bloques."
  },
  {
    id: "duolingo",
    name: "Duolingo",
    hosts: ["duolingo.com"],
    category: "education",
    description: "Idiomas."
  },
  {
    id: "youtubekids",
    name: "YouTube Kids",
    hosts: ["youtubekids.com"],
    category: "education",
    description: "V\xEDdeo con cat\xE1logo infantil."
  }
];
const BLOCK_HOSTS = {
  adult: [
    "pornhub.com",
    "xvideos.com",
    "xnxx.com",
    "xhamster.com",
    "redtube.com",
    "youporn.com",
    "spankbang.com",
    "chaturbate.com",
    "onlyfans.com",
    "fansly.com",
    "manyvids.com",
    "stripchat.com",
    "livejasmin.com",
    "brazzers.com",
    "adultfriendfinder.com",
    "xnxx.tv",
    "rule34.xxx",
    "nhentai.net",
    "gelbooru.com",
    "e621.net",
    "redgifs.com",
    "pornhub.org",
    "hqporner.com",
    "missav.com",
    "hanime.tv",
    "xvideos.es",
    "xnxx.es",
    "youjizz.com",
    "tube8.com"
  ],
  violence: [
    "bestgore.com",
    "theync.com",
    "kaotic.com",
    "goregrish.com",
    "documentingreality.com"
  ],
  gambling: [
    "bet365.com",
    "betfair.com",
    "pokerstars.com",
    "stake.com",
    "draftkings.com",
    "fanduel.com",
    "888casino.com",
    "bwin.com",
    "williamhill.com",
    "pinnacle.com",
    "roobet.com",
    "bc.game"
  ],
  drugs: [
    "silkroad.com",
    "darknetlive.com",
    "dread.live"
  ],
  hate: [
    "stormfront.org",
    "dailystormer.su",
    "gab.com"
  ],
  social: [
    "tiktok.com",
    "instagram.com",
    "snapchat.com",
    "discord.com",
    "discord.gg",
    "reddit.com",
    "x.com",
    "twitter.com",
    "facebook.com",
    "tumblr.com"
  ]
};
const BLOCK_KEYWORDS = {
  porn: "adult",
  xxx: "adult",
  nsfw: "adult",
  onlyfans: "adult",
  "xvideos": "adult",
  "xnxx": "adult",
  "pornhub": "adult",
  hentai: "adult",
  "rule34": "adult",
  "camgirl": "adult",
  "sexshop": "adult",
  porno: "adult",
  "xxxvideos": "adult",
  "redgifs": "adult",
  "hanime": "adult",
  "futanari": "adult",
  gore: "violence",
  "bestgore": "violence",
  casino: "gambling",
  "apuestas": "gambling",
  poker: "gambling",
  "slots": "gambling",
  "apuesta": "gambling"
};
const IMAGE_SEARCH_HINTS = [
  "tbm=isch",
  "tbm=iv",
  "udm=2",
  "images.google.",
  "bing.com/images",
  "yandex.com/images",
  "yahoo.com/images"
];
const SAFE_DESTINATIONS = [
  { name: "Wikipedia", host: "wikipedia.org", hint: "Consultar" },
  { name: "Khan Academy", host: "khanacademy.org", hint: "Estudiar" },
  { name: "Scratch", host: "scratch.mit.edu", hint: "Crear" },
  { name: "Duolingo", host: "duolingo.com", hint: "Idiomas" },
  { name: "NatGeo Kids", host: "kids.nationalgeographic.com", hint: "Explorar" },
  { name: "NASA Kids", host: "spaceplace.nasa.gov", hint: "Ciencia" }
];
const AGE_BANDS = [
  { id: "6-9", label: "6\u20139 a\xF1os", daily: 60, weekly: 420, blockSocial: true },
  { id: "10-12", label: "10\u201312 a\xF1os", daily: 90, weekly: 630, blockSocial: true },
  { id: "13-15", label: "13\u201315 a\xF1os", daily: 120, weekly: 840, blockSocial: false },
  { id: "16-17", label: "16\u201317 a\xF1os", daily: 150, weekly: 1050, blockSocial: false }
];
const AVATAR_KEYS = ["pine", "moss", "slate", "clay", "dusk"];
export {
  AGE_BANDS,
  AVATAR_KEYS,
  BLOCK_HOSTS,
  BLOCK_KEYWORDS,
  CATALOG_APPS,
  IMAGE_SEARCH_HINTS,
  SAFE_DESTINATIONS
};
