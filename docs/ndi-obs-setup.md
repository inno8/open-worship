# NDI & OBS Setup

This guide explains what NDI is, how to install NDI Runtime, how to enable NDI in Open Worship, and how to use the app as an NDI source in OBS—including as a transparent overlay on a camera feed.

---

## What is NDI?

**NDI** (Network Device Interface) is a standard for sending video and audio over a local network with low latency. In our case, Open Worship can **send** its lyric output as a video stream so that:

- **OBS Studio** (or other NDI-compatible software) can receive it as a source.
- You can overlay lyrics on a camera feed, full-screen graphics, or other sources.
- The overlay can be **transparent** (only text and graphics, no black background), so the camera or background shows through.

You don’t need NDI to use Open Worship for in-room projection; NDI is for feeding lyrics into a **livestream** or recording setup.

---

## Installing NDI Runtime

1. Go to [NDI Tools](https://ndi.video/tools/) and download the **NDI Runtime** (or the full NDI Tools package, which includes Runtime).
2. Run the installer and follow the steps. Restart the computer if prompted.
3. **Optional for developers:** The full **NDI SDK** is only needed if you are building Open Worship from source and want real NDI output. For normal use, **NDI Runtime** is enough for the app to send NDI when it’s built with NDI support.

If NDI isn’t installed, Open Worship may show **NDI Mock** mode: the pipeline runs and the source name appears, but no real NDI stream is sent (useful for testing without OBS).

---

## Enabling NDI in Open Worship

1. Open **Settings** from the sidebar.
2. Find the **NDI Output** section.
3. Turn **Enable NDI Output** **On** (toggle switch).
4. Set **NDI Source Name** to something you’ll recognize in OBS (e.g. `Open Worship` or `Lyrics`). This is the name that will appear in OBS when you add an NDI source.
5. Save or confirm; settings are stored automatically.

When you’re in **Presenter** and go live, the app will try to send the current slide as NDI. The Presenter header shows an **NDI** (or **NDI MOCK**) badge when NDI is enabled and running.

**Status in Settings:**

- **“NDI not available (install NDI SDK)”** — NDI Runtime or SDK not found; install NDI Runtime (and SDK if you built the app yourself).
- **“NDI ready — enable to start”** — Runtime is available; turn the toggle on.
- **“Broadcasting as ‘Open Worship’”** — NDI is on and sending.
- **“Mock mode — pipeline active…”** — App is running the NDI pipeline but not sending a real stream (e.g. Runtime only, no SDK build). You’ll see the source name in the app but not in OBS until real NDI is available.

---

## Setting up OBS with the NDI plugin

1. **Install OBS Studio** from [obsproject.com](https://obsproject.com) if you haven’t already.
2. **Install the OBS NDI plugin** so OBS can receive NDI sources:
   - Search for “OBS NDI” or go to the [obs-ndi releases](https://github.com/obs-ndi/obs-ndi/releases) page.
   - Download and run the installer for your OS. Restart OBS after installing.
3. Open OBS. **Sources** will now include **NDI™ Source** (or similar) when you add a source.

---

## Adding Open Worship as an NDI source in OBS

1. In OBS, click **+** in the **Sources** list.
2. Choose **NDI™ Source** (or “NDI Source”).
3. Name it (e.g. “Lyrics”) and click OK.
4. In the source settings, open the **Source** dropdown. You should see **Open Worship** (or whatever you set as **NDI Source Name** in the app). Select it.
5. Click OK. The lyrics output from Open Worship should appear in the OBS preview.

If you don’t see the source:

- Confirm NDI is **Enabled** in Open Worship Settings and that you’ve pressed **GO LIVE** at least once in Presenter (so the app is sending).
- Restart OBS and/or Open Worship and check again.
- On some systems, NDI only appears when both the sender (Open Worship) and the receiver (OBS) are on the same machine or same network; ensure firewall or VPN isn’t blocking NDI.

---

## Transparent overlay on camera feed

To show only the lyrics (and optional background) on top of a camera feed:

1. **In Open Worship:**  
   - Use a **transparent** or dark default background in Settings if you want the camera to show through.  
   - (The app may send alpha; behavior depends on build. If the NDI stream includes transparency, OBS will show it.)

2. **In OBS:**  
   - Add your **camera** source first (e.g. “Camera” or “Video Capture Device”).  
   - Add the **NDI™ Source** (Open Worship) **above** the camera in the Sources list so it’s on top.  
   - Resize and position the NDI source so the lyrics sit where you want (e.g. lower third).  
   - If the NDI source has a black background you don’t want, try:
     - In the NDI source properties, see if there’s a “Key” or “Alpha” option.  
     - Or use OBS **Color Key** / **Chroma Key** on the NDI source to key out black (if the stream is not actually transparent).

Result: the camera is the base layer; the lyrics from Open Worship appear on top. Advance slides in Presenter as usual; OBS will show the same frame.

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| **No NDI source in OBS** | Install NDI Runtime; enable NDI in Open Worship; go live in Presenter at least once; restart OBS. |
| **“NDI not available” in Settings** | Install [NDI Runtime](https://ndi.video/tools/). If you built the app yourself, you may need the NDI SDK and a rebuild. |
| **Source appears as “NDI MOCK”** | Mock mode = app is running NDI pipeline but not sending a real stream. Install NDI Runtime; for a development build, you may need the SDK and a build with NDI support. |
| **Lyrics are delayed** | NDI is low-latency; check CPU usage and close other heavy apps. Ensure Open Worship and OBS are on the same machine or same LAN. |
| **Black box around lyrics** | If the stream isn’t transparent, use OBS Color Key on the NDI source to key out black, or adjust the background in Open Worship. |
| **OBS doesn’t list NDI** | Reinstall the [OBS NDI plugin](https://github.com/obs-ndi/obs-ndi) and restart OBS. |

For more on NDI with “Runtime only” (no SDK), see the developer note in the repo: `desktop/docs/NDI-Runtime-only-alternatives.md`.

---

## Summary

1. Install **NDI Runtime** (and NDI SDK if you’re building the app).
2. In Open Worship **Settings**, enable **NDI Output** and set **NDI Source Name**.
3. Install the **OBS NDI plugin** and restart OBS.
4. In OBS, add an **NDI™ Source** and select **Open Worship** (or your source name).
5. Place the NDI source above your camera in OBS for a lyrics overlay; use Color Key if you need to remove a black background.
