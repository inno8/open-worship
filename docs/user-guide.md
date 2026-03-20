---
layout: default
title: User Guide
nav_order: 3
has_children: true
description: "Complete guide to all Open Worship features"
---

# User Guide

A complete guide to using Open Worship for church presentations.

---

## Overview

Open Worship has four main sections:

1. **Library** — Store and organize your songs
2. **Schedule** — Build setlists for services
3. **Presenter** — Run the live presentation
4. **Settings** — Configure the app

---

## Library

The Library is your song database. Here you can:

- **Add songs** manually or import from text files
- **Edit** lyrics, titles, and metadata
- **Search** by title or lyrics
- **Tag** songs for easy organization (e.g., "Christmas", "Communion")
- **Delete** songs you no longer need

### Adding a Song

1. Click **+ Add Song**
2. Enter the title
3. Paste or type the lyrics
4. (Optional) Add tags
5. Click **Save**

### Importing Songs

You can import songs from `.txt` files:

1. Click **Import**
2. Select one or more `.txt` files
3. The importer will detect sections automatically

**Text file format:**

```
Amazing Grace

[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me

[Chorus]
My chains are gone, I've been set free
```

### Section Markers

Use these markers to organize your songs:

| Marker | Example |
|--------|---------|
| `[Verse 1]` | First verse |
| `[Verse 2]` | Second verse |
| `[Chorus]` | Chorus |
| `[Pre-Chorus]` | Pre-chorus |
| `[Bridge]` | Bridge |
| `[Intro]` | Intro |
| `[Outro]` | Outro |
| `[Tag]` | Tag/ending |

---

## Schedule

Schedules are setlists for your services.

### Creating a Schedule

1. Click **+ New Schedule**
2. Name it (e.g., "Sunday Service - March 19")
3. Add songs from the library
4. Drag to reorder
5. Save

### Schedule Items

You can add:

- **Songs** from your library
- **Blank slides** for transitions

### Saving & Loading

Schedules are saved automatically. You can:

- Load previous schedules
- Duplicate a schedule
- Delete old schedules

---

## Presenter

The Presenter is where you run the service.

### Layout

The Presenter shows:

- **Left panel:** Schedule or song list
- **Center:** Current slide preview
- **Right:** Upcoming slides
- **Bottom:** Live controls

### Going Live

1. Select a song
2. Click **GO LIVE**
3. The lyrics appear on your output display

### Navigation

| Key | Action |
|-----|--------|
| **Space** | Next slide |
| **→** | Next slide |
| **←** | Previous slide |
| **↑** | Previous slide |
| **↓** | Next slide |
| **B** | Toggle black screen |
| **Esc** | Stop live |

### Black Screen

Press **B** to show a black screen (useful during prayer or announcements). Press **B** again to return to the previous slide.

---

## Settings

Configure Open Worship to match your needs.

### Display

Select which monitor/projector to output to.

### Appearance

| Setting | Description |
|---------|-------------|
| **Font Family** | Choose the display font |
| **Font Size** | Adjust text size (8-200px) |
| **Font Weight** | Light to bold (100-900) |
| **Text Color** | Color of the lyrics |
| **Shadow Blur** | Text shadow blur amount (0-20) |
| **Shadow Offset** | X and Y offset for shadow |
| **Shadow Color** | Color of the text shadow |

### Backgrounds

- Choose solid colors from presets
- Pick any custom color
- Import background images

### NDI Output

Enable NDI to send lyrics to OBS or other video software:

1. Toggle **Enable NDI Output**
2. Set the **NDI Source Name**
3. Choose **Text Position**:
   - **Center** — Full screen (for dedicated lyrics display)
   - **Lower Third** — Bottom 1/3 of screen (for overlay)

See [NDI & OBS Setup](ndi-obs-setup) for detailed instructions.

### Data Management

- **Export Backup** — Save songs, schedules, and settings
- **Clear All Data** — Reset the app (use with caution!)

---

## Tips & Best Practices

### Before the Service

1. **Prepare your schedule** — Build it during the week
2. **Test the projector** — Make sure output works
3. **Check songs** — Verify lyrics are correct
4. **Run through once** — Practice navigating

### During the Service

1. **Stay one slide ahead** — Watch for cues
2. **Use black screen** — B key during prayer
3. **Don't panic** — Arrows go both ways!

### Song Organization

- Use **tags** for seasonal songs (Christmas, Easter)
- Keep **commonly used songs** at the top
- **Delete duplicates** to keep library clean

---

## Keyboard Shortcuts

See the full list: [Keyboard Shortcuts](keyboard-shortcuts)

---

## Troubleshooting

See [FAQ](faq) for common issues.
