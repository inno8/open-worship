---
layout: default
title: Adding Songs
nav_order: 4
parent: User Guide
---

# Adding Songs

This guide explains how to add songs to your library, the lyrics format (including section markers), how to import from text files, and how to edit, delete, and organize songs with tags.

---

## Adding a song manually

1. Open **Library** from the sidebar.
2. Click **+ Add Song** (at the bottom of the song list, or in the center if the library is empty).
3. In the dialog, fill in:
   - **Title** — Song title (e.g. “Amazing Grace”).
   - **Author** — Artist or writer (e.g. “John Newton”).
   - **Lyrics** — Full lyrics using section markers (see [Song format and section markers](#song-format-and-section-markers)).
   - **Tags** — Comma-separated (e.g. `worship, hymn, traditional`) for search and filtering.
4. Click **Save Song**.

The song appears in the list. You can select it to view or edit, or **Add to Schedule** to put it in the current schedule.

---

## Song format and section markers

Lyrics are split into **sections** (verses, chorus, bridge, etc.). Each section becomes one or more **slides** (the app shows up to about 3 lines per slide and may split long sections automatically).

### Section markers

Use square brackets on their own line, with the section name inside:

- `[Verse 1]`
- `[Verse 2]`
- `[Chorus]`
- `[Bridge]`
- `[Pre-Chorus]`
- `[Outro]`
- `[Intro]`
- `[Tag]`
- `[Refrain]`

You can use any label (e.g. `[Verse 1]`, `[Chorus]`); the app will use it as the section title. Section names are shown on the slide (e.g. “Verse 1”, “Chorus”) in Presenter.

### Example

```text
[Verse 1]
Amazing grace how sweet the sound
That saved a wretch like me
I once was lost but now I'm found
Was blind but now I see

[Chorus]
Amazing grace how sweet the sound
That saved a wretch like me

[Verse 2]
'Twas grace that taught my heart to fear
...
```

- **Title and author:** You can put the title on the first line and optionally “by Author” or “Author: Name” on the second when importing from a file (see below). When adding manually, use the **Title** and **Author** fields in the dialog.
- **Blank lines** between sections are fine. Empty lines inside a section are also allowed.
- **Long sections** may be split into multiple slides (e.g. “Verse 1 (1)”, “Verse 1 (2)”) so that only a few lines show per slide.

---

## Importing from text files

You can bulk-import songs from `.txt`, `.text`, or `.lyrics` files.

1. In **Library**, click **Import from File** (on the empty-state screen) or, inside the Add/Edit Song dialog, click **Import from File**.
2. Select one or more text files. Each file is treated as one song.

### What the importer expects

- **First line** — Treated as the song title (unless it looks like a section marker such as `[Verse 1]`).
- **Second line (optional)** — Treated as author if it looks like:
  - `by Artist Name`
  - `Author: Artist Name`
  - `Artist: Artist Name`
  - or a short line before the first section marker.
- **Rest of file** — Treated as lyrics. Section markers like `[Verse 1]`, `[Chorus]`, `[Bridge]`, etc. are used to split sections.
- If the lyrics don’t start with a section marker, the importer adds `[Verse 1]` at the beginning.

**Tip:** Keep one song per file. Use the section format above for best results. The importer may also auto-format long sections into multiple slides.

---

## Editing a song

1. In **Library**, select the song in the list.
2. Click **Edit** (top right of the detail area).
3. Change **Title**, **Author**, **Lyrics**, or **Tags**.
4. Click **Update Song**.

You can also assign a **background** for this song: in the song detail, click the **Background** control and pick “Use Default Background” or one of the images you’ve added in Settings.

---

## Deleting a song

1. In **Library**, select the song.
2. Click **Delete**.
3. Confirm in the dialog. This cannot be undone.

Deleting a song does not remove it from existing schedules; those schedule entries may show as missing or “Unknown” until you remove them from the schedule or replace them.

---

## Tags for organization

- When adding or editing a song, use the **Tags** field with comma-separated values (e.g. `worship, hymn, contemporary`).
- In Library, the **search** box matches title, author, lyrics, and tags. Use tags to quickly find groups of songs (e.g. “hymn”, “Christmas”, “Spanish”).
- Tags are optional; you can leave the field empty.

---

## Adding a song to the schedule from Library

1. Select the song in **Library**.
2. Click **Add to Schedule**. If no schedule exists, a default one is created.
3. The song is appended to the active schedule. You can reorder it in **Schedule** (see [Building Schedules](building-schedules.md)).

---

## Summary

| Action | How |
|--------|-----|
| Add song | Library → **+ Add Song** → fill Title, Author, Lyrics, Tags → **Save Song** |
| Import songs | Library → **Import from File** → choose `.txt` / `.text` / `.lyrics` files |
| Edit song | Library → select song → **Edit** → change fields → **Update Song** |
| Delete song | Library → select song → **Delete** → confirm |
| Section markers | Use `[Verse 1]`, `[Chorus]`, `[Bridge]`, etc. on their own line in Lyrics |
| Tags | Comma-separated in the Tags field; searchable in Library |
