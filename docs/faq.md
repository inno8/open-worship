---
layout: default
title: FAQ
nav_order: 9
description: "Frequently asked questions and troubleshooting"
---

# FAQ

Common questions and troubleshooting tips for Open Worship.

---

## General

### What is Open Worship?

Open Worship is free, open-source church presentation software. You can manage a song library, build service schedules, and display lyrics on a projector or send them to OBS via NDI for livestreaming.

### Do I need an internet connection?

No. The app runs locally. You only need the network if you use optional features (e.g. backend sync or NDI to another machine).

### Is it really free?

Yes. The project is open source (MIT license). There are no subscriptions or in-app purchases.

---

## Songs and library

### Why don’t my lyrics show in sections?

Lyrics need **section markers** on their own line, e.g. `[Verse 1]`, `[Chorus]`, `[Bridge]`. Without these, the app may treat everything as one block. See [Adding Songs — Song format and section markers](adding-songs.md#song-format-and-section-markers).

### Can I import from PowerPoint or ProPresenter?

Not directly. Open Worship imports from **plain text files** (`.txt`, `.text`, `.lyrics`) with title, author, and lyrics with section markers. You can copy lyrics from another program into a text file and use the format described in [Adding Songs](adding-songs.md).

### How many lines per slide?

The app typically shows about **3 lines per slide** and may split long sections automatically (e.g. “Verse 1 (1)”, “Verse 1 (2)”). You can keep verses short or use more section markers to control where slides break.

### Can I assign a different background per song?

Yes. In **Library**, select the song, then use the **Background** control in the song detail to choose “Use Default Background” or one of the images you added in **Settings → Backgrounds**.

---

## Schedules

### How do I have more than one schedule?

The app can store multiple schedules. The one you see and edit in **Schedule** is the **active** schedule. Create or switch schedules using the Schedule view (or any schedule selector your build provides). The **Presenter** Schedule tab always shows the **active** schedule.

### I added a song to the schedule but don’t see it in Presenter.

Confirm you’re on the **Schedule** tab in Presenter (not the Songs tab) and that the schedule you’re editing in **Schedule** is the same one that’s active. Reload the app if you just switched schedules.

### Can I reorder schedule items?

Yes. In **Schedule**, use the **up** and **down** arrows on each item to move it. Order is saved automatically.

---

## Presenter and output

### GO LIVE does nothing / no output on the projector.

- In **Settings → Display**, set **Presentation Output** to the correct monitor (or “Auto (Primary)” if the projector is the primary display).
- Make sure you’ve selected an item and a verse in Presenter so there’s something to show.
- Try clicking **→ LIVE** once to push the current preview to the output.

### My keyboard shortcuts don’t work in Presenter.

Shortcuts are ignored when focus is in a **text field** (e.g. the song search box). Click somewhere else in the window (e.g. the verse list or the preview area) and try again.

### How do I get a black screen quickly?

Press **B** in Presenter, or click the **Black** button. To show lyrics again, press Space or click the next slide.

### Can I use two monitors?

Yes. Use **Settings → Display → Presentation Output** to choose which monitor shows the audience output. The main app stays on the other display.

---

## NDI and OBS

### What does “NDI MOCK” mean?

The app is running the NDI pipeline but **not** sending a real NDI stream (e.g. NDI Runtime is installed but the build doesn’t include full NDI support). Install [NDI Runtime](https://ndi.video/tools/) and, if you built from source, ensure the app is built with NDI support. See [NDI & OBS Setup](ndi-obs-setup.md).

### Open Worship doesn’t appear as an NDI source in OBS.

- Enable **NDI Output** in Open Worship **Settings** and set a **NDI Source Name**.
- Go to **Presenter** and press **GO LIVE** at least once so the app starts sending.
- Install the [OBS NDI plugin](https://github.com/obs-ndi/obs-ndi) and restart OBS.
- Check that NDI Runtime is installed and that firewall/network isn’t blocking NDI.

### How do I overlay lyrics on my camera in OBS?

Add your camera source first, then add an **NDI™ Source** and select Open Worship. Place the NDI source above the camera in the Sources list and position it. If the lyrics have a black background, you can try OBS **Color Key** on the NDI source to key out black. See [NDI & OBS Setup — Transparent overlay](ndi-obs-setup.md#transparent-overlay-on-camera-feed).

---

## Data and backup

### Where is my data stored?

Songs and schedules are stored locally (e.g. in the app’s data folder or SQLite database, depending on the build). Optional backend sync can store data on a server if configured.

### How do I backup my songs and schedules?

Use **Settings → Data Management → Export Backup**. This downloads a JSON file with your songs, schedules, and key settings. Keep this file somewhere safe.

### I cleared all data by mistake. Can I restore?

There is no built-in “restore from backup” yet. Restore from a backup file if you have one (e.g. re-import or use a future restore feature). Always **Export Backup** before using “Clear All Data.”

---

## Troubleshooting

### The app won’t start or crashes.

- Ensure you have the required runtime (Node/Electron for the desktop app; Python/venv for the backend if you run it).
- Try removing or renaming the app’s data folder and starting fresh (you’ll lose local data unless you have a backup).
- Check the [GitHub issues](https://github.com/inno8/open-worship/issues) for similar reports.

### Lyrics look wrong (font, size, color).

Adjust **Settings → Appearance**: Font family, font size, font weight, and text color. Use the preview in that section to check. You can also set a **default background** (color or image) under **Settings → Backgrounds**.

### Second display not listed in Settings.

Connect the display and turn it on before opening the app. Restart the app after connecting. On some systems, “Auto (Primary)” will use the primary display; try that if only one monitor is listed.

---

## Getting more help

- **Documentation:** [Docs index](README.md) — Getting Started, Adding Songs, Building Schedules, Running a Service, NDI & OBS, Keyboard Shortcuts.
- **Bugs and features:** [GitHub repository](https://github.com/inno8/open-worship) — open an issue or check existing ones.
