---
layout: default
title: Home
nav_order: 1
description: "Open Worship - Free, open-source church presentation software"
permalink: /
---

# Open Worship
{: .fs-9 }

Free, open-source church presentation software for worship lyrics.
{: .fs-6 .fw-300 }

[Download Now](https://github.com/inno8/open-worship/releases){: .btn .btn-primary .fs-5 .mb-4 .mb-md-0 .mr-2 }
[Get Started](getting-started){: .btn .fs-5 .mb-4 .mb-md-0 }

---

## ✨ Features

| Feature | Description |
|:--------|:------------|
| 🎵 **Song Library** | Organize, search, and manage your worship songs |
| 📋 **Service Schedules** | Build setlists ahead of time or on-the-fly |
| 🖥️ **Multi-Display** | Project lyrics to any connected screen |
| 📺 **NDI & OBS** | Overlay lyrics on livestreams with transparency |
| 🔄 **API Sync** | Connect to external systems via REST API |
| ⌨️ **Keyboard Shortcuts** | Fast navigation during live services |

---

## 📸 Screenshots

### Presenter View
Control your service with real-time preview and live output.

![Presenter View](assets/screenshots/presenter.png)

### Song Library
Organize, search, and manage your worship song collection.

![Library View](assets/screenshots/library.png)

### Settings
Customize fonts, colors, NDI output, and more.

![Settings](assets/screenshots/settings.png)

---

## 🚀 Quick Start

### 1. Download

| Platform | Download |
|:---------|:---------|
| **Windows** | [Open-Worship-Setup.exe](https://github.com/inno8/open-worship/releases) |
| **macOS** | [Open-Worship.dmg](https://github.com/inno8/open-worship/releases) |
| **Linux** | [Open-Worship.AppImage](https://github.com/inno8/open-worship/releases) |

### 2. Add Songs

1. Open the **Library** tab
2. Click **+ Add Song**
3. Enter the title and lyrics
4. Use markers like `[Verse 1]`, `[Chorus]`, `[Bridge]` to organize sections

### 3. Build a Schedule

1. Go to **Present** tab
2. Click **Back to Schedules**
3. Create a new schedule and add songs

### 4. Go Live

1. Select a song from your schedule
2. Click a verse to preview it
3. Press **Enter** or click **→ LIVE** to send to output
4. Use **Space** or arrow keys to navigate

---

## 📖 Documentation

- [Getting Started](getting-started) — Installation and first launch
- [User Guide](user-guide) — Complete feature guide
- [NDI & OBS Setup](ndi-obs-setup) — Livestream integration
- [Keyboard Shortcuts](keyboard-shortcuts) — Quick reference
- [FAQ](faq) — Common questions

---

## 💻 For Developers

### Tech Stack

| Component | Technology |
|:----------|:-----------|
| Desktop | Electron + React + TypeScript |
| Backend | Django + REST Framework |
| Database | SQLite |
| NDI | koffi bindings |

### Build from Source

```bash
git clone https://github.com/inno8/open-worship.git
cd open-worship/desktop
npm install
npm run dev
```

See the [GitHub repository](https://github.com/inno8/open-worship) for full build instructions.

---

## 📄 License

MIT License — free for personal and commercial use.
