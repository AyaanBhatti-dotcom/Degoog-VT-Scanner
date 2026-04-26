# 🛡️ VirusTotal Scanner — Degoog Plugin

> A privacy-first search experience deserves security to match.

---

## Background

In today's digital landscape, privacy should be a fundamental right — not an afterthought. Major search engines and browsers constantly track everything you search, building profiles on you without your knowledge or consent. [Degoog](https://github.com/fccview/degoog) is a self-hosted, AI-stripped, Chromium-based search server that puts your privacy back in your hands, aggregating results from multiple engines without the surveillance.

But privacy alone isn't enough. Knowing whether the links you're clicking are actually safe is just as important. That's where this plugin comes in.

---

## What This Plugin Does

**VirusTotal Scanner** is a slot plugin for [Degoog](https://github.com/fccview/degoog) that automatically scans the top search result URL against the [VirusTotal v3 API](https://developers.virustotal.com/reference/overview) every time you perform a search — before you ever click a link.

### Features

- **Automatic scanning** — No manual action required. Every search automatically checks the top result URL against VirusTotal's database of 90+ antivirus engines.
- **Instant verdicts** — Results are displayed directly in the search results page (SERP) above the links, showing a clear **SAFE**, **MALICIOUS**, or **SUSPICIOUS** verdict.
- **Detailed stats** — Shows a full breakdown of how many engines flagged the URL as malicious, suspicious, or clean (e.g. `3 malicious · 1 suspicious · 57 clean · 91 engines`).
- **On-demand submission** — If a URL hasn't been scanned by VirusTotal before, the plugin automatically submits it for analysis and notifies you to check back in ~60 seconds.
- **Secure by design** — Your VirusTotal API key is stored server-side in a `.env` file and never exposed to the browser or included in any client-side code.
- **Lightweight** — Runs as a native Degoog slot plugin with no external dependencies. Pure JavaScript, no build step required.

### Verdict States

| State | Display | Meaning |
|---|---|---|
| ✔ SAFE | Green | No engines flagged this URL |
| ✘ MALICIOUS | Red | One or more engines detected malware |
| ⚠ SUSPICIOUS | Amber | One or more engines flagged as suspicious |
| ⏳ QUEUED | Blue | URL submitted for first-time analysis |

---

## Installation

### Prerequisites

- A running [Degoog](https://github.com/fccview/degoog) instance (v0.14.0 or later)
- A free [VirusTotal API key](https://www.virustotal.com) (sign up at virustotal.com)

### Step 1 — Add your API key

Add the following to your Degoog `.env` file (in the root of your Degoog installation):

```
VIRUSTOTAL_API_KEY=your_api_key_here
```

> ⚠️ Never hardcode your API key into any file. Keep it in `.env` and make sure `.env` is in your `.gitignore`.

### Step 2 — Install via Degoog Store

1. Open Degoog and navigate to **Settings → Store**
2. Click **Add repository** and paste the following URL:
   ```
   https://github.com/AyaanBhatti-dotcom/Degoog-VT-Scanner
   ```
3. Click **Refresh** on the repository
4. Find **VirusTotal Scanner** in the catalog and click **Install**
5. Navigate to **Settings → Plugins** and make sure the plugin is toggled on

### Step 3 — Restart Degoog

```bash
docker compose restart
```

That's it. Search anything and the scanner will appear automatically above your results.

---

## How It Works

The plugin is built as a **slot plugin** for Degoog's native plugin system. When you perform a search:

1. Degoog passes the top result URL to the plugin's `execute()` function server-side
2. The plugin encodes the URL in base64url format (as required by the VirusTotal v3 API spec)
3. It makes a GET request to `https://www.virustotal.com/api/v3/urls/{id}` using your API key
4. If the URL is not yet in VirusTotal's database, it submits it via POST for analysis
5. The response stats are parsed and rendered as an HTML card injected directly into the SERP

All API communication happens **server-side** inside your Degoog Docker container. Your API key never touches the browser.

---

## Project Structure

```
Degoog-VT-Scanner/
├── plugins/
│   └── vt-scanner/
│       ├── index.js          # Core plugin logic — VT API calls & HTML rendering
│       ├── template.html     # HTML template for the scan result card
│       ├── style.css         # Styles for the scan result card
│       ├── author.json       # Plugin author metadata
│       └── locales/
│           └── en.json       # English locale strings
└── package.json              # Degoog store manifest
```

---

## Privacy & Security Notes

- This plugin does **not** send your search queries to VirusTotal — only the URL of the top result is checked.
- VirusTotal is owned by Google. If you want zero third-party exposure, you can disable the plugin in **Settings → Plugins** at any time.
- The plugin includes SSRF protection in its design — private/internal IP ranges cannot be submitted for scanning.
- Your API key is loaded exclusively from environment variables and is never returned to the client.

---

## Built With

- [Degoog](https://github.com/fccview/degoog) — Privacy-focused self-hosted search server
- [VirusTotal API v3](https://developers.virustotal.com/reference/overview) — URL threat intelligence
- [Bun](https://bun.sh) — JavaScript runtime powering Degoog
- [Docker](https://www.docker.com) — Container deployment

---

## License

MIT — do whatever you want with it, just don't hardcode API keys.
