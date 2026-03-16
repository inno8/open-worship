# NDI with Runtime Only (no SDK) — Alternatives

You have **NDI Runtime** installed but not the **NDI SDK** (e.g. Windows blocks the SDK installer). The `grandiose` package compiles native code that **requires the SDK** (headers and libs), so it fails to build with Runtime only.

Below are practical options, ordered by recommendation.

---

## 1. Pre-built Grandiose Binaries (Runtime only)

- **Status:** The official `grandiose@0.0.4` on npm is **source-only** (no `prebuild`/`node-pre-gyp`). There are no official pre-built binaries that work with “Runtime only.”
- **Community:** Check for community forks or packages that publish prebuilds (e.g. `grandiose-prebuilt`, or forks on GitHub). Run:
  ```bash
  npm search ndi
  npm search grandiose
  npm view <package-name>
  ```
  to see if any package offers Windows prebuilds and only requires Runtime at runtime.

**Verdict:** Unlikely unless a third party publishes such a package; worth a quick npm/GitHub search.

---

## 2. Another npm NDI Package with Pre-built Binaries

- Search npm for other NDI bindings that might ship pre-built `.node` or DLLs and only need Runtime at run time:
  ```bash
  npm search ndi
  ```
  Look for packages that use **prebuild**, **node-pre-gyp**, or similar and list Windows in their targets.
- Your code already supports an alternative module name: `NdiOutput.ts` tries `require('ndi')` after `require('grandiose')`, so any package that exposes the same API (e.g. `send()`, sender with `video()`, `FOURCC_RGBA`) could be dropped in.

**Verdict:** Best path if you find a maintained package with Windows prebuilds and a compatible API.

---

## 3. Use NDI Runtime DLLs via FFI (e.g. `ffi-napi` / `koffi`)

- **Runtime** installs the same NDI library DLLs the SDK uses at runtime (e.g. `Processing.NDI.Lib.x64.dll`). The SDK only adds **headers and import libraries** for compilation.
- You can avoid compiling C++ by loading the Runtime DLL directly from Node with an FFI layer:
  - **ffi-napi** (or **koffi**): load `Processing.NDI.Lib.x64.dll` (from the Runtime install path or bundled next to your app).
  - Define the NDI API you need (e.g. `NDIlib_initialize`, `NDIlib_send_create`, `NDIlib_send_send_video_v2`, etc.) using the [NDI SDK documentation](https://docs.ndi.tv/) or the C headers.
  - Allocate buffers (e.g. for RGBA frames) and call the NDI functions from JavaScript/TypeScript.

**Pros:** Works with **Runtime only**; no SDK or native compile step on your machine.  
**Cons:** You maintain the FFI bindings and struct definitions; you must match ABI (e.g. struct layout, calling convention).

**Verdict:** Most reliable way to get real NDI output with only Runtime installed, at the cost of some one-time binding work.

---

## 4. Other Approaches

| Approach | Notes |
|----------|--------|
| **Build grandiose elsewhere** | Build on a machine/CI where the SDK is installed, then copy the resulting `.node` (and any NDI DLLs) to your Windows dev box. You still need the SDK somewhere to compile. |
| **Vendored SDK** | If the NDI license allows, vendor SDK headers/libs in the repo and point grandiose’s build at them. Then `npm install` could build without a global SDK. Check [NDI license](https://ndi.video/) before doing this. |
| **Docker/WSL build** | Use a Linux (or Windows) image with the SDK to run `npm install` / `electron-rebuild` and produce the `.node` artifact for Windows. |
| **Mock mode (current)** | Your app already has a solid mock mode when grandiose isn’t available; you can keep developing and only enable real NDI where the SDK (or an FFI solution) is available. |

---

## Recommended path

1. **Quick check:** Run `npm search ndi` and inspect any package that mentions “prebuild”, “Windows”, or “Runtime”. If you find one with a compatible API, add it (or use it as `ndi` so your existing `NdiOutput` fallback picks it up).
2. **If nothing fits:** Implement a small **ffi-napi** (or **koffi**) binding that loads `Processing.NDI.Lib.x64.dll` and calls the sender API. That gives you real NDI with only Runtime installed and keeps your current architecture (optional native vs mock).
3. **Optional:** On a machine or CI where the SDK is available, build grandiose once and reuse the `.node` + DLLs on your Windows box so you don’t need the SDK locally for that build.

If you want to pursue the FFI approach, the next step is to add `ffi-napi` (or `koffi`) and implement a thin wrapper that mirrors the `grandiose` sender API your `NdiOutput` expects, so the rest of the app stays unchanged.
