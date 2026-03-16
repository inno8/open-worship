/**
 * NDI Runtime DLL bindings via ffi-napi.
 * Requires NDI Runtime (e.g. "NDI 5 Runtime") installed. DLL is typically at:
 *   - C:\Program Files\NDI\NDI 5 Runtime\v5\Processing.NDI.Lib.x64.dll
 *   - C:\Program Files\NDI\NDI 6 Runtime\v6\Processing.NDI.Lib.x64.dll
 *   - Or set NDI_RUNTIME_DIR to the directory containing Processing.NDI.Lib.x64.dll
 */

import ffi from 'ffi-napi'
import ref from 'ref-napi'
import path from 'path'
import fs from 'fs'

const DLL_NAME = 'Processing.NDI.Lib.x64.dll'

/** Possible NDI Runtime install locations (Windows). */
const NDI_RUNTIME_PATHS = [
  process.env.NDI_RUNTIME_DIR,
  'C:\\Program Files\\NDI\\NDI 6 Runtime\\v6',
  'C:\\Program Files\\NDI\\NDI 5 Runtime\\v5',
  'C:\\Program Files\\NDI\\NDI 4 Runtime\\v4',
  path.join(process.resourcesPath || '', 'ndi'), // packaged app
].filter(Boolean) as string[]

function findNdiDll(): string | null {
  for (const dir of NDI_RUNTIME_PATHS) {
    const candidate = path.join(dir, DLL_NAME)
    try {
      if (fs.existsSync(candidate)) return candidate
    } catch {
      // ignore
    }
  }
  return null
}

const dllPath = findNdiDll()

// --- ref-napi types ---
const bool = ref.types.uint8
const int = ref.types.int
const int64 = ref.types.int64
const float = ref.types.float
const pointer = ref.refType(ref.types.void)
const charPtr = ref.refType(ref.types.char)
const uint8Ptr = ref.refType(ref.types.uint8)

/** NDIlib_send_create_t */
const NDIlib_send_create_t = ref.struct({
  p_ndi_name: charPtr,
  p_groups: charPtr,
  clock_video: bool,
  clock_audio: bool,
})

/** NDIlib_video_frame_v2_t - order and padding must match NDI SDK. */
const NDIlib_video_frame_v2_t = ref.struct({
  xres: int,
  yres: int,
  FourCC: int,
  frame_rate_N: int,
  frame_rate_D: int,
  picture_aspect_ratio: float,
  frame_format_type: int,
  timecode: int64,
  p_data: uint8Ptr,
  line_stride_in_bytes: int,
  p_metadata: charPtr,
  timestamp: int64,
})

export const NDI_FOURCC_VIDEO_TYPE_RGBA = 0x41424752 // 'RGBA' in FourCC
export const NDI_FRAME_FORMAT_TYPE_PROGRESSIVE = 0

export interface NdiFFIBinding {
  NDIlib_initialize: () => number
  NDIlib_send_create: (p_create_settings: Buffer) => Buffer
  NDIlib_send_send_video_v2: (p_instance: Buffer, p_video_data: Buffer) => void
  NDIlib_send_destroy: (p_instance: Buffer) => void
  NDIlib_destroy: () => void
}

let ndiLib: NdiFFIBinding | null = null
let initialized = false

function loadNdiLib(): NdiFFIBinding | null {
  if (ndiLib) return ndiLib
  if (!dllPath) {
    console.warn('NDI FFI: DLL not found. Tried:', NDI_RUNTIME_PATHS.join(', '))
    return null
  }
  try {
    ndiLib = ffi.Library(dllPath, {
      NDIlib_initialize: [bool, []],
      NDIlib_send_create: [pointer, [ref.refType(NDIlib_send_create_t)]],
      NDIlib_send_send_video_v2: [ref.types.void, [pointer, ref.refType(NDIlib_video_frame_v2_t)]],
      NDIlib_send_destroy: [ref.types.void, [pointer]],
      NDIlib_destroy: [ref.types.void, []],
    }) as unknown as NdiFFIBinding
    console.log('NDI FFI: loaded', dllPath)
    return ndiLib
  } catch (err) {
    console.warn('NDI FFI: failed to load DLL', dllPath, err)
    return null
  }
}

/**
 * Call NDIlib_initialize. Returns true if the NDI library was initialized.
 */
export function ndiInitialize(): boolean {
  const lib = loadNdiLib()
  if (!lib) return false
  if (initialized) return true
  const ok = lib.NDIlib_initialize()
  if (ok) {
    initialized = true
    console.log('NDI FFI: NDIlib_initialize OK')
  } else {
    console.warn('NDI FFI: NDIlib_initialize failed')
  }
  return !!ok
}

/**
 * Create an NDI send instance. Returns a Buffer (pointer) or null.
 */
export function ndiSendCreate(ndiName: string, clockVideo: boolean, clockAudio: boolean): Buffer | null {
  const lib = loadNdiLib()
  if (!lib || !initialized && !ndiInitialize()) return null
  const nameBuf = Buffer.from(ndiName + '\0', 'utf8')
  const groupsBuf = Buffer.from('\0', 'utf8')
  const createStruct = Buffer.alloc(NDIlib_send_create_t.size)
  let off = 0
  createStruct.writeBigUInt64LE(BigInt(nameBuf.address?.() ?? 0), off)
  off += 8
  createStruct.writeBigUInt64LE(BigInt(groupsBuf.address?.() ?? 0), off)
  off += 8
  createStruct.writeUInt8(clockVideo ? 1 : 0, off++)
  createStruct.writeUInt8(clockAudio ? 1 : 0, off)
  // ref-napi struct: we need to set pointers correctly. ref-napi doesn't give Buffer.address().
  // Use ref.alloc and ref-napi's struct set.
  const p_ndi_name = ref.alloc(ref.types.CString, ndiName)
  const p_groups = ref.alloc(ref.types.CString, '')
  const settings = ref.alloc(NDIlib_send_create_t)
  settings.ref().p_ndi_name = p_ndi_name
  settings.ref().p_groups = p_groups
  settings.ref().clock_video = clockVideo ? 1 : 0
  settings.ref().clock_audio = clockAudio ? 1 : 0
  const instance = lib.NDIlib_send_create(settings)
  if (!instance || instance.isNull()) return null
  return instance
}

/**
 * Send a video frame (RGBA). p_instance from ndiSendCreate; data is RGBA buffer.
 */
export function ndiSendVideoV2(
  pInstance: Buffer,
  data: Buffer,
  width: number,
  height: number,
  lineStrideInBytes: number
): void {
  const lib = loadNdiLib()
  if (!lib) return
  const frame = ref.alloc(NDIlib_video_frame_v2_t)
  const f = frame.ref()
  f.xres = width
  f.yres = height
  f.FourCC = NDI_FOURCC_VIDEO_TYPE_RGBA
  f.frame_rate_N = 30000
  f.frame_rate_D = 1001
  f.picture_aspect_ratio = width / height
  f.frame_format_type = NDI_FRAME_FORMAT_TYPE_PROGRESSIVE
  f.timecode = 0n
  f.p_data = data
  f.line_stride_in_bytes = lineStrideInBytes
  f.p_metadata = ref.NULL
  f.timestamp = 0n
  lib.NDIlib_send_send_video_v2(pInstance, frame)
}

/**
 * Destroy an NDI send instance.
 */
export function ndiSendDestroy(pInstance: Buffer): void {
  const lib = loadNdiLib()
  if (lib) lib.NDIlib_send_destroy(pInstance)
}

/**
 * Destroy the NDI library (call once on shutdown).
 */
export function ndiDestroy(): void {
  const lib = loadNdiLib()
  if (lib && initialized) {
    lib.NDIlib_destroy()
    initialized = false
  }
}

export function isNdiFfiAvailable(): boolean {
  return dllPath !== null
}

export function getNdiDllPath(): string | null {
  return dllPath
}
