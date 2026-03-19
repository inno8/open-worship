---
layout: default
title: Getting Started - Open Worship
---

# Getting Started

This guide will help you install Open Worship and get it running for your first service.

---

## System Requirements

| Requirement | Minimum |
|-------------|---------|
| **OS** | Windows 10/11, macOS 10.15+, Linux |
| **RAM** | 4 GB |
| **Storage** | 200 MB |
| **Display** | 1280x720 or higher |

For **NDI output** (livestreaming), you'll also need:
- NDI Runtime installed (free from [ndi.tv](https://ndi.tv/tools/))
- Gigabit network recommended for best quality

---

## Installation

### Windows

1. Download **Open Worship Setup.exe** from the [Releases page](https://github.com/inno8/open-worship/releases)
2. Run the installer
3. Follow the prompts
4. Launch Open Worship from the Start menu or desktop shortcut

### macOS

Coming soon. For now, you can [build from source](#running-from-source).

### Linux

Coming soon. For now, you can [build from source](#running-from-source).

---

## First Launch

When you first open Open Worship, you'll see the main interface:

### The Interface

Open Worship has four main areas accessible from the sidebar:

| Tab | Purpose |
|-----|---------|
| **Library** | Your song database. Add, edit, search, and organize songs. |
| **Schedule** | Build service setlists. Add songs, reorder, and save for future use. |
| **Presenter** | Run the service. Show slides, navigate with keyboard, control live output. |
| **Settings** | Configure displays, fonts, colors, backgrounds, NDI output, and more. |

---

## Adding Your First Song

1. Click **Library** in the sidebar
2. Click the **+ Add Song** button
3. Enter the song title (e.g., "Amazing Grace")
4. Paste or type the lyrics

### Organizing Lyrics with Sections

Use section markers to divide your song:

```
[Verse 1]
Amazing grace, how sweet the sound
That saved a wretch like me
I once was lost, but now I'm found
Was blind but now I see

[Verse 2]
'Twas grace that taught my heart to fear
And grace my fears relieved
How precious did that grace appear
The hour I first believed

[Chorus]
My chains are gone, I've been set free
My God, my Savior has ransomed me
And like a flood His mercy reigns
Unending love, amazing grace
```

Supported section types: `[Verse]`, `[Chorus]`, `[Bridge]`, `[Pre-Chorus]`, `[Outro]`, `[Intro]`, `[Tag]`

---

## Creating Your First Schedule

1. Click **Schedule** in the sidebar
2. Click **+ New Schedule**
3. Give it a name (e.g., "Sunday Service - March 19")
4. Click **Add Song** to add songs from your library
5. Drag and drop to reorder
6. Click **Save**

---

## Presenting

1. Click **Presenter** in the sidebar
2. Select your schedule (or browse songs directly)
3. Click on a song to load it
4. Click **GO LIVE** to start outputting to your display
5. Use these controls:

| Key | Action |
|-----|--------|
| **Space** or **→** | Next slide |
| **←** | Previous slide |
| **↑** / **↓** | Previous / Next slide |
| **B** | Black screen (toggle) |
| **Esc** | Stop live presentation |

---

## Setting Up Your Display

1. Go to **Settings** in the sidebar
2. Under **Display**, select your projector or second monitor
3. The lyrics will output to that screen when you click **GO LIVE**

**Tip:** If you only have one screen, Open Worship will show a preview. For actual services, connect a projector or second monitor.

---

## Next Steps

- [Adding Songs](adding-songs) — Import songs, use tags, edit lyrics
- [Building Schedules](building-schedules) — Advanced schedule features
- [NDI & OBS Setup](ndi-obs-setup) — Overlay lyrics on your livestream
- [Keyboard Shortcuts](keyboard-shortcuts) — Master the hotkeys

---

## Need Help?

- Check the [FAQ](faq) for common issues
- Report bugs on [GitHub Issues](https://github.com/inno8/open-worship/issues)
