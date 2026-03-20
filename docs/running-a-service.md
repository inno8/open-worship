---
layout: default
title: Running a Service
nav_order: 6
parent: User Guide
---

# Running a Service

This guide explains how to run lyrics during a service: using the **GO LIVE** button, the Presenter view, keyboard controls, multi-display setup, and quick access to songs.

---

## The GO LIVE button

In **Presenter**, the header has:

- **Black** — Sends a black screen to the output immediately (stays black until you change the slide or go off live).
- **GO LIVE** — Starts sending the current **Preview** to the presentation output (projector or NDI). The button turns green and shows **● STOP**.
- **● STOP** — Stops sending to the output. The audience display stops updating until you press **GO LIVE** again.

**Typical flow:**

1. Before the service: build your schedule and open **Presenter**.
2. Select the first item and first verse/slide in the list.
3. When you’re ready to show lyrics, press **GO LIVE** (or **Enter**). The current preview goes to the output.
4. Advance slides with **Space** or **arrow keys** (see [Keyboard navigation](#keyboard-navigation)).
5. For a black screen (e.g. prayer), press **B** or click **Black**.
6. At the end, press **● STOP** or **Escape** to stop the output.

---

## Presenter view explained

Presenter has three main areas:

### 1. Schedule / Songs (left)

- **Schedule** tab — Lists all items in the **active** schedule (songs, custom text, blank). Click an item to load its verses/slides. The first item is auto-selected if none is chosen.
- **Songs** tab — Full song library with search. Use this to pull up a song that isn’t in the schedule (e.g. an extra song). Click a song to see its verses; use **+** to add it to the schedule on the fly.

### 2. Verses / slides (center)

- Shows the sections (Verse 1, Chorus, etc.) for the selected schedule item or song.
- **Click a verse** — Updates the **Preview** (and, if you’re live, also updates the **Live** output).
- **Double‑click a verse** — Pushes that slide to the output and turns **GO LIVE** on if it wasn’t already (“→ LIVE” behavior).

Use this list to see what’s coming and to jump to any slide.

### 3. Preview and Live (right)

- **Preview** — What will go out when you push or go live. You can change the slide background here (small background icon) for the current slide.
- **Live** — What is currently on the audience display. A green dot and “LIVE” mean output is active.
- **→ LIVE** — Sends the current Preview to the output (and turns live on if needed).

So: choose item → choose verse (click or double‑click) → use **GO LIVE** or **→ LIVE** as needed.

---

## Keyboard navigation

These shortcuts work in Presenter when the focus is not in a text field (e.g. not in the song search box):

| Key | Action |
|-----|--------|
| **Space** | Next slide (or next schedule item at end of current item). |
| **→** or **↓** | Same as Space (next slide). |
| **←** or **↑** | Previous slide (or previous schedule item at start of current). |
| **B** | Black screen (send black to output). |
| **Enter** | Toggle GO LIVE on/off. |
| **Escape** | If live, stop live (same as ● STOP). |

Full list: [Keyboard Shortcuts](keyboard-shortcuts.md).

---

## Multi-display setup

- **Operator screen** — The main app window (Library, Schedule, Presenter, Settings) stays on your laptop or control monitor.
- **Audience output** — The slides the congregation sees. This can be:
  - A **second monitor** (projector or TV) chosen in **Settings → Display → Presentation Output**. Pick the display you want (e.g. “Monitor 2”) or leave “Auto (Primary)” to use the primary display.
  - **NDI** — If you use OBS or another NDI receiver, enable NDI in Settings and add “Open Worship” as an NDI source. The same slide content is sent over NDI (see [NDI & OBS Setup](ndi-obs-setup.md)).

So: run Presenter on your machine, set the correct **Presentation Output** in Settings if using a second monitor, and press **GO LIVE** when you want that output (or NDI) to show the current slide.

---

## Quick song access during the service

- **From the schedule** — Use the **Schedule** tab and click the next song (or any item) in the list. Verses load in the center; click or double‑click to update Preview/Live.
- **Ad‑hoc song** — Switch to the **Songs** tab, search for the song, click it. Click a verse to preview; double‑click to push to live. Use **+** to add the song to the schedule so it appears in the Schedule tab as well.
- **Black** — Press **B** anytime for a black screen; advance or change slide to bring lyrics back.

---

## Tips for volunteers

1. **Before the service:** Open Presenter, select the right schedule, and click through the first few items to confirm order and verses.
2. **Rehearse:** Practice Space/arrows and **B** so you don’t have to look at the keyboard.
3. **One person on lyrics:** If two people run the app, agree who advances slides to avoid double-presses.
4. **Backup:** Export a backup from Settings occasionally; if the machine is replaced, you can restore or re-import data.

For NDI and livestreaming, see [NDI & OBS Setup](ndi-obs-setup.md). For all shortcuts, see [Keyboard Shortcuts](keyboard-shortcuts.md).
