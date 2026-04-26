let templateHtml = "";

const _esc = (s) => {
  if (typeof s !== "string") return String(s);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

// Encode URL to base64url as required by VirusTotal v3 API
const encodeVTUrl = (rawUrl) => {
  const b64 = btoa(rawUrl);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Derive status from VT stats object
const deriveStatus = (stats) => {
  if (stats.malicious > 0)  return "malicious";
  if (stats.suspicious > 0) return "suspicious";
  if (stats.harmless > 0 || stats.undetected > 0) return "safe";
  return "unscanned";
};

export const slot = {
  id: "vt-scanner",
  name: "VirusTotal Scanner",
  description: "Scans the top search result URL via VirusTotal.",
  position: "at-a-glance",

  settingsSchema: [
    { key: "enabled", label: "Enabled", type: "toggle" },
  ],

  async init(ctx) {
    if (ctx.readFile) {
      templateHtml = await ctx.readFile("template.html");
    }
  },

  configure(settings) {
    this._enabled = settings?.enabled !== "false";
  },

  // Trigger whenever there's a search query (we scan the top result URL)
  trigger(query) {
    return this._enabled !== false && query.trim().length > 0;
  },

  async execute(query, context) {
    const fetchFn = context?.fetch || fetch;
    const apiKey = process.env.VIRUSTOTAL_API_KEY;

    if (!apiKey) {
      return { html: "" }; // silently skip if not configured
    }

    // Pull the top result URL from context if available
    const topUrl = context?.results?.[0]?.url;
    if (!topUrl) return { html: "" };

    // Skip non-http URLs
    if (!topUrl.startsWith("http://") && !topUrl.startsWith("https://")) {
      return { html: "" };
    }

    const encodedUrl = encodeVTUrl(topUrl);
    const VT_BASE = "https://www.virustotal.com/api/v3";

    try {
      // Try fetching existing VT data first
      const res = await fetchFn(`${VT_BASE}/urls/${encodedUrl}`, {
        method: "GET",
        headers: { "x-apikey": apiKey, Accept: "application/json" },
      });

      let stats;
      let note = "";

      if (res.status === 404) {
        // Submit for scanning
        await fetchFn(`${VT_BASE}/urls`, {
          method: "POST",
          headers: {
            "x-apikey": apiKey,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `url=${encodeURIComponent(topUrl)}`,
        });
        stats = { malicious: 0, suspicious: 0, harmless: 0, undetected: 0 };
        note = "URL submitted to VirusTotal — reload in ~60s for results.";
      } else if (!res.ok) {
        return { html: "" };
      } else {
        const json = await res.json();
        stats = json?.data?.attributes?.last_analysis_stats;
        if (!stats) return { html: "" };
      }

      const status = deriveStatus(stats);
      const total = (stats.malicious + stats.suspicious + stats.harmless + stats.undetected) || 1;

      const statusMap = {
        safe:       { icon: "✔", text: "SAFE",       cls: "vt-status-safe" },
        malicious:  { icon: "✘", text: "MALICIOUS",  cls: "vt-status-malicious" },
        suspicious: { icon: "⚠", text: "SUSPICIOUS", cls: "vt-status-suspicious" },
        unscanned:  { icon: "⏳", text: "QUEUED",     cls: "vt-status-unscanned" },
      };

      const { icon, text, cls } = statusMap[status] ?? { icon: "?", text: "UNKNOWN", cls: "vt-status-error" };
      const statsText = `${stats.malicious} malicious · ${stats.suspicious} suspicious · ${stats.harmless} clean · ${total} engines`;

      const fallback = `<div class="vt-widget"><div class="vt-header">🛡 VirusTotal Scanner</div><div class="vt-body"><div class="vt-url">{{url}}</div><div class="vt-status {{statusClass}}">{{statusIcon}} {{statusText}}</div><div class="vt-stats">{{stats}}</div><div class="vt-note">{{note}}</div></div></div>`;

      const html = (templateHtml || fallback)
        .replace("{{url}}", _esc(topUrl))
        .replace("{{statusClass}}", cls)
        .replace("{{statusIcon}}", icon)
        .replace("{{statusText}}", text)
        .replace("{{stats}}", _esc(statsText))
        .replace("{{note}}", _esc(note));

      return { html };
    } catch {
      return { html: "" };
    }
  },
};

export default { slot };
