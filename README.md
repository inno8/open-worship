<p align="center">
  <img src="desktop/assets/icons/icon-256x256.png" alt="Open Worship Logo" width="128">
</p>

<h1 align="center">Open Worship</h1>

<p align="center">
  <strong>Free, open-source church presentation software</strong><br>
  Display worship lyrics on screens and livestreams with ease.
</p>

<p align="center">
  <a href="https://github.com/inno8/open-worship/releases">
    <img src="https://img.shields.io/github/v/release/inno8/open-worship?style=flat-square" alt="Release">
  </a>
  <a href="https://github.com/inno8/open-worship/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/inno8/open-worship?style=flat-square" alt="License">
  </a>
  <a href="https://github.com/inno8/open-worship/stargazers">
    <img src="https://img.shields.io/github/stars/inno8/open-worship?style=flat-square" alt="Stars">
  </a>
</p>

<p align="center">
  <a href="https://github.com/inno8/open-worship/releases">Download</a> •
  <a href="https://inno8.github.io/open-worship/">Documentation</a> •
  <a href="https://inno8.github.io/open-worship/getting-started">Getting Started</a> •
  <a href="https://inno8.github.io/open-worship/ndi-obs-setup">OBS/NDI Setup</a>
</p>

---

## ✨ Features

- 🎵 **Song Library** — Organize, search, and tag your worship songs
- 📋 **Service Schedules** — Build setlists ahead of time or on-the-fly
- 🖥️ **Multi-Display** — Project lyrics to any connected screen
- 📺 **OBS/NDI Integration** — Overlay lyrics on livestreams with transparency
- 🔄 **Real-Time Sync** — Connect external apps via WebSocket API
- 📁 **Easy Import** — Load songs from .txt files
- ⌨️ **Keyboard Shortcuts** — Fast navigation with Space, arrows, and hotkeys

---

## 📸 Screenshots

<!-- Add your screenshots here -->
<p align="center">
  <em>Screenshots coming soon</em>
</p>

---

## 🚀 Quick Start

### Download

Download the latest release for your platform:

| Platform | Download |
|----------|----------|
| **Windows** | [Open Worship Setup.exe](https://github.com/inno8/open-worship/releases) |
| **macOS** | Coming soon |
| **Linux** | Coming soon |

### Basic Usage

1. **Add songs** in the Library
2. **Build a schedule** with your setlist
3. **Present** — Click GO LIVE and use Space/arrows to navigate

📖 **Full documentation:** [inno8.github.io/open-worship](https://inno8.github.io/open-worship/)

---

## 📺 Livestream Integration

Open Worship supports **NDI output** for seamless integration with OBS, vMix, and other streaming software.

**Lower Third Mode:** Output lyrics as a 1920×360 strip for overlaying on your livestream.

See the [NDI & OBS Setup Guide](https://inno8.github.io/open-worship/ndi-obs-setup) for detailed instructions.

---

## 💻 Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop App | Electron + React + TypeScript |
| Backend API | Django + Django REST Framework |
| Database | SQLite |
| NDI Output | grandiomedia/ndi |

---

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Python 3.10+ (for backend, optional)

### Running from Source

```bash
# Clone the repository
git clone https://github.com/inno8/open-worship.git
cd open-worship

# Desktop app
cd desktop
npm install
npm run dev

# Backend (optional, for sync features)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Building

```bash
cd desktop
npm run build        # Build web assets
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS app
npm run build:linux  # Build Linux AppImage
```

---

## 📖 Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](https://inno8.github.io/open-worship/getting-started) | Installation and basic setup |
| [User Guide](https://inno8.github.io/open-worship/user-guide) | Complete feature guide |
| [NDI & OBS Setup](https://inno8.github.io/open-worship/ndi-obs-setup) | Livestream integration |
| [Keyboard Shortcuts](https://inno8.github.io/open-worship/keyboard-shortcuts) | Quick reference |
| [FAQ](https://inno8.github.io/open-worship/faq) | Common questions |

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free for personal and commercial use.

See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for churches everywhere
</p>
