---
layout: default
title: NDI & OBS Setup
nav_order: 7
description: "Set up NDI output for OBS livestream overlays"
---

# NDI & OBS Setup

NDI (Network Device Interface) lets you send Open Worship lyrics to video software like OBS, vMix, or Wirecast for livestreaming.

---

## What is NDI?

NDI is a video-over-IP protocol. It sends video over your local network without cables. Open Worship outputs lyrics as an NDI source that you add to OBS as a layer.

**Use cases:**
- Overlay lyrics on top of camera feed for livestream
- Send lyrics to a separate display via NDI
- Combine with other video sources in OBS

---

## Prerequisites

1. **Open Worship** (desktop app)
2. **OBS Studio** (or vMix, Wirecast, etc.)
3. **NDI Runtime** — required on every machine that uses NDI

---

## Step 1: Install NDI Runtime

Download and install the free **NDI Tools** from [ndi.tv/tools](https://ndi.tv/tools/).

This includes NDI Runtime, which is required for NDI to work.

**After installing, restart Open Worship and OBS.**

---

## Step 2: Enable NDI in Open Worship

1. Open **Settings** in the sidebar
2. Scroll to **NDI Output**
3. Toggle **Enable NDI Output** on
4. Set a **Source Name** (e.g., "Open Worship")
5. Choose **Text Position**:

| Mode | Frame Size | Use Case |
|------|------------|----------|
| **Center** | 1920×1080 | Full screen display |
| **Lower Third** | 1920×360 | Bottom overlay for livestreams |

6. You'll see the status: "Broadcasting as Open Worship"

---

## Step 3: Install OBS NDI Plugin

1. Download the **OBS NDI plugin** from [github.com/DistroAV/DistroAV](https://github.com/DistroAV/DistroAV/releases)
2. Run the installer
3. Restart OBS Studio

---

## Step 4: Add NDI Source in OBS

1. Open OBS Studio
2. In your scene, click **+** under Sources
3. Select **NDI™ Source**
4. Name it (e.g., "Lyrics")
5. In the **Source name** dropdown, select **Open Worship** (or your custom name)
6. Click OK

---

## Step 5: Position the Lyrics

### For Lower Third Mode (Overlay)

If you're using **Lower Third** mode (1920×360), position the source at the bottom:

1. Right-click the NDI source → **Transform** → **Edit Transform**
2. Set:
   - **Position X:** 0
   - **Position Y:** 720 (for 1080p canvas)
   - **Size:** 1920 × 360
3. Close

The lyrics will now appear at the bottom of your stream.

### For Center Mode (Full Screen)

1. Right-click the NDI source
2. Select **Transform** → **Fit to screen** (or press Ctrl+F)

---

## Transparent Overlay (Chroma Key)

To make the background transparent and only show text:

### In Open Worship:
1. Go to **Settings** → **Backgrounds**
2. Set a solid **green background** (#00FF00)

### In OBS:
1. Right-click the NDI source → **Filters**
2. Click **+** → **Chroma Key**
3. Set **Key Color Type** to **Green**
4. Adjust **Similarity** until the green is removed (~400)
5. Adjust **Smoothness** to clean up edges (~80)

Now your lyrics appear over your video with a transparent background!

---

## Troubleshooting

### NDI source not showing in OBS

- ✅ Make sure NDI Runtime is installed from ndi.tv/tools
- ✅ Both Open Worship and OBS must be on the same network
- ✅ Try restarting both applications
- ✅ Check firewall — allow NDI ports 5960-5969
- ✅ In OBS, click the Source dropdown refresh button

### "Mock mode" warning

If you see "Mock mode" in Open Worship Settings, the NDI SDK isn't fully installed.

1. Download NDI Tools from [ndi.tv/tools](https://ndi.tv/tools/)
2. Run the installer
3. Restart Open Worship

### Poor quality or lag

- Use **wired Ethernet** instead of WiFi
- Close other network-heavy applications
- Both machines should be on a **Gigabit network**

### Lyrics not updating

- Make sure **GO LIVE** is active in Presenter
- Check that NDI is enabled in Settings
- Try disabling and re-enabling NDI

---

## Alternative: Window Capture

If NDI doesn't work for you, use OBS Window Capture:

1. In Open Worship, use **GO LIVE** to show lyrics on a window
2. In OBS, add a **Window Capture** source
3. Select the Open Worship presentation window
4. Crop or resize as needed

This is simpler but doesn't support transparency.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Install NDI Tools from ndi.tv |
| 2 | Enable NDI in Open Worship Settings |
| 3 | Install OBS NDI plugin |
| 4 | Add NDI Source in OBS |
| 5 | Position at bottom (for lower third) |
| 6 | Add Chroma Key filter (for transparency) |

Now your lyrics are ready for livestreaming! 🎉

