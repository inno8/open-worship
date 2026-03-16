# Open Worship

**Free, open-source church presentation software.**

Display worship song lyrics with ease — a modern alternative to EasyWorship.

📖 **User documentation:** [docs/](docs/README.md) — getting started, adding songs, building schedules, running a service, NDI/OBS setup, shortcuts, and FAQ for church tech volunteers.

## Features

- 🎵 **Song Library** — Organize and search your worship songs
- 📋 **Service Schedules** — Build setlists ahead of time or live
- 🖥️ **Multi-Display** — Project to any connected screen
- 📺 **OBS/NDI Integration** — Overlay lyrics on livestreams
- 🔄 **Real-Time Sync** — Connect external apps via WebSocket
- 📁 **Import** — Load songs from .txt files or Google Drive
- ⌨️ **Keyboard Shortcuts** — Space/arrows for quick navigation

## Tech Stack

| Component | Technology |
|-----------|------------|
| Desktop | Electron + React + TypeScript |
| Backend | Django + DRF + Channels |
| Database | SQLite |
| NDI | grandiomedia/ndi |

## Project Structure

```
open-worship/
├── desktop/          # Electron + React app
├── backend/          # Django REST API + WebSocket
├── docs/             # Documentation
└── scripts/          # Build & deployment scripts
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/inno8/open-worship.git
cd open-worship

# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Desktop (separate terminal)
cd desktop
npm install
npm run dev
```

## License

MIT License — free for personal and commercial use.

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Made with ❤️ for churches everywhere.
