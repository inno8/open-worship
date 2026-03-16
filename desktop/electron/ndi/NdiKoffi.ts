/**
 * NDI FFI wrapper using koffi
 * Calls NDI Runtime DLLs directly - no SDK required
 */

import koffi from 'koffi'
import path from 'path'

// NDI Runtime DLL path
const NDI_DLL_PATH = 'C:\\Program Files\\NDI\\NDI 6 Runtime\\v6\\Processing.NDI.Lib.x64.dll'

let ndiLib: koffi.IKoffiLib | null = null
let initialized = false

// NDI structures (simplified)
const NDIlib_send_create_t = koffi.struct('NDIlib_send_create_t', {
  p_ndi_name: 'const char*',
  p_groups: 'const char*',
  clock_video: 'bool',
  clock_audio: 'bool'
})

const NDIlib_video_frame_v2_t = koffi.struct('NDIlib_video_frame_v2_t', {
  xres: 'int',
  yres: 'int',
  FourCC: 'int', // NDIlib_FourCC_video_type_e
  frame_rate_N: 'int',
  frame_rate_D: 'int',
  picture_aspect_ratio: 'float',
  frame_format_type: 'int', // NDIlib_frame_format_type_e
  timecode: 'int64',
  p_data: 'uint8*',
  line_stride_in_bytes: 'int',
  p_metadata: 'const char*',
  timestamp: 'int64'
})

// FourCC codes (NDI on Windows typically expects BGRA for correct colors)
const FOURCC_RGBA = 0x41424752 // 'RGBA' in little-endian
const FOURCC_BGRA = 0x41524742 // 'BGRA' in little-endian

// Function pointers
let NDIlib_initialize: (() => boolean) | null = null
let NDIlib_destroy: (() => void) | null = null
let NDIlib_send_create: ((p_create_settings: unknown) => unknown) | null = null
let NDIlib_send_destroy: ((p_instance: unknown) => void) | null = null
let NDIlib_send_send_video_v2: ((p_instance: unknown, p_video_data: unknown) => void) | null = null

export function loadNdiLibrary(): boolean {
  if (ndiLib) return true
  
  try {
    ndiLib = koffi.load(NDI_DLL_PATH)
    
    // Load functions
    NDIlib_initialize = ndiLib.func('NDIlib_initialize', 'bool', [])
    NDIlib_destroy = ndiLib.func('NDIlib_destroy', 'void', [])
    NDIlib_send_create = ndiLib.func('NDIlib_send_create', 'void*', [koffi.pointer(NDIlib_send_create_t)])
    NDIlib_send_destroy = ndiLib.func('NDIlib_send_destroy', 'void', ['void*'])
    NDIlib_send_send_video_v2 = ndiLib.func('NDIlib_send_send_video_v2', 'void', ['void*', koffi.pointer(NDIlib_video_frame_v2_t)])
    
    console.log('NDI library loaded successfully')
    return true
  } catch (err) {
    console.error('Failed to load NDI library:', err)
    return false
  }
}

export function initializeNdi(): boolean {
  if (initialized) return true
  if (!loadNdiLibrary()) return false
  
  try {
    initialized = NDIlib_initialize!()
    console.log('NDI initialized:', initialized)
    return initialized
  } catch (err) {
    console.error('Failed to initialize NDI:', err)
    return false
  }
}

export function destroyNdi(): void {
  if (!initialized || !NDIlib_destroy) return
  NDIlib_destroy()
  initialized = false
  console.log('NDI destroyed')
}

export class NdiSender {
  private instance: unknown = null
  private sourceName: string

  constructor(sourceName: string) {
    this.sourceName = sourceName
  }

  start(): boolean {
    if (this.instance) return true
    if (!initializeNdi()) return false
    
    try {
      const createSettings = {
        p_ndi_name: this.sourceName,
        p_groups: null,
        clock_video: false,
        clock_audio: false
      }
      
      this.instance = NDIlib_send_create!(createSettings)
      
      if (!this.instance) {
        console.error('Failed to create NDI sender')
        return false
      }
      
      console.log(`NDI sender created: "${this.sourceName}"`)
      return true
    } catch (err) {
      console.error('Error creating NDI sender:', err)
      return false
    }
  }

  stop(): void {
    if (!this.instance) return
    
    try {
      NDIlib_send_destroy!(this.instance)
      this.instance = null
      console.log('NDI sender destroyed')
    } catch (err) {
      console.error('Error destroying NDI sender:', err)
    }
  }

  sendFrame(data: Buffer, width: number, height: number): void {
    if (!this.instance) return
    
    try {
      const videoFrame = {
        xres: width,
        yres: height,
        FourCC: FOURCC_BGRA,
        frame_rate_N: 30000,
        frame_rate_D: 1001,
        picture_aspect_ratio: width / height,
        frame_format_type: 1, // progressive
        timecode: -1n, // auto
        p_data: data,
        line_stride_in_bytes: width * 4,
        p_metadata: null,
        timestamp: 0n
      }
      
      NDIlib_send_send_video_v2!(this.instance, videoFrame)
    } catch (err) {
      console.error('Error sending NDI frame:', err)
    }
  }

  get isRunning(): boolean {
    return this.instance !== null
  }
}

export function isNdiAvailable(): boolean {
  return loadNdiLibrary()
}
