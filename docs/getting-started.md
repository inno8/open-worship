# Getting Started

This page covers system requirements, how to install Open Worship, what to do on first launch, and a quick tour of the interface.

---

## System requirements

- **OS:** Windows 10/11, macOS, or Linux (desktop app runs on Electron).
- **RAM:** 4 GB minimum; 8 GB recommended for NDI and multiple displays.
- **Display:** One screen for the operator; a second display or NDI for the audience output is optional.
- **NDI (optional):** For sending lyrics to OBS or other NDI tools, you need [NDI Runtime](https://ndi.video/tools/) installed. See [NDI & OBS Setup](ndi-obs-setup.md).

---

## Installation

Open Worship has two parts: a **backend** (optional, for sync/API) and the **desktop** app (what you use to run lyrics).

### Desktop app (required)

1. **Clone the repository** (or download the source):
   ```bash
   git clone https://github.com/inno8/open-worship.git
   cd open-worship
   ```

2. **Run the backend** (in one terminal):
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate  # Mac/Linux
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Run the desktop app** (in a second terminal):
   ```bash
   cd desktop
   npm install
   npm run dev
   ```

The app window opens when `npm run dev` is running. On first run, the backend is optional; the app can store songs and schedules locally without it.

### Pre-built installers (if available)

If your church provides a pre-built installer (e.g. Windows `.exe` or macOS `.dmg`), run it and follow the prompts. No need to run backend or `npm` in that case.

---

## First launch

1. The app opens to the **Presenter** view by default (you can change this later via the sidebar).
2. If you have no songs yet, go to **Library** and add or import songs (see [Adding Songs](adding-songs.md)).
3. In **Schedule**, create or open a schedule and add songs to it (see [Building Schedules](building-schedules.md)).
4. In **Presenter**, select your schedule, pick a slide, and press **GO LIVE** when you’re ready to show lyrics (see [Running a Service](running-a-service.md)).

Optional: open **Settings** to set your **Presentation Output** display, enable **NDI**, and adjust fonts and backgrounds.

---

## Overview of the interface

The main window has a **sidebar** on the left and a **main area** that changes by section.

### Sidebar

- **Library** — Open your song library (add, edit, search, import).
- **Schedule** — Build and edit service schedules (songs, custom text, blank slides).
- **Presenter** — Run the service (schedule + verses, preview, live output, GO LIVE).
- **Settings** — Display, NDI, appearance, backgrounds, data backup, and shortcuts.

Click any item to switch views.

### Library

- **Left:** Search and list of all songs.
- **Right:** Details of the selected song (title, author, tags, lyrics by section). Buttons to **Edit**, **Delete**, and **Add to Schedule**.
- **Add Song** at the bottom (or **Import from File** in the empty state) to add or import songs.

### Schedule

- **Left:** Name and date of the active schedule, plus the ordered list of items (songs, custom text, blank slides). Buttons to reorder (up/down), remove, and edit custom text.
- **Right:** “Add Songs” — search and grid of songs; click **+** on a song to add it to the schedule. Buttons to add a **blank slide** or **custom text** item.

### Presenter

- **Left:** Tabs for **Schedule** and **Songs**. Under Schedule: list of schedule items. Under Songs: search and full song list (for ad‑hoc use).
- **Center:** Verses/slides for the selected item or song; click a verse to preview and double‑click to push to live.
- **Right:** **Preview** (what will go out) and **Live** (what’s currently on the output). Buttons: **Black** (blackout), **GO LIVE** / **STOP**, and **→ LIVE** (push current preview to output).

When NDI is enabled and running, a small **NDI** indicator appears in the header.

### Settings

Sections for:

- **Backend Sync** — WebSocket URL for optional backend connection.
- **Display** — Which monitor to use for presentation output (or “Auto (Primary)”).
- **NDI Output** — Enable NDI and set the NDI source name (e.g. “Open Worship”).
- **Appearance** — Font family, size, weight, text color, and a preview.
- **Backgrounds** — Default background (colors and images); add or remove images.
- **Keyboard Shortcuts** — Reference list of shortcuts.
- **Data Management** — Export backup, clear data.
- **About** — App version and link to the project.

---

## Next steps

- [Adding Songs](adding-songs.md) — Build your library and import from files.
- [Building Schedules](building-schedules.md) — Create setlists for each service.
- [Running a Service](running-a-service.md) — Use Presenter and GO LIVE in the room or over NDI.
