/**
 * Quick test script for NDI output
 * Run with: node test-ndi.js
 */

const koffi = require('koffi')

const NDI_DLL_PATH = 'C:\\Program Files\\NDI\\NDI 6 Runtime\\v6\\Processing.NDI.Lib.x64.dll'

console.log('Loading NDI library...')
const lib = koffi.load(NDI_DLL_PATH)
console.log('✓ NDI library loaded')

// Define structures
const NDIlib_send_create_t = koffi.struct('NDIlib_send_create_t', {
  p_ndi_name: 'const char*',
  p_groups: 'const char*',
  clock_video: 'bool',
  clock_audio: 'bool'
})

const NDIlib_video_frame_v2_t = koffi.struct('NDIlib_video_frame_v2_t', {
  xres: 'int',
  yres: 'int',
  FourCC: 'int',
  frame_rate_N: 'int',
  frame_rate_D: 'int',
  picture_aspect_ratio: 'float',
  frame_format_type: 'int',
  timecode: 'int64',
  p_data: 'void*',
  line_stride_in_bytes: 'int',
  p_metadata: 'const char*',
  timestamp: 'int64'
})

// Load functions
const NDIlib_initialize = lib.func('NDIlib_initialize', 'bool', [])
const NDIlib_send_create = lib.func('NDIlib_send_create', 'void*', [koffi.pointer(NDIlib_send_create_t)])
const NDIlib_send_destroy = lib.func('NDIlib_send_destroy', 'void', ['void*'])
const NDIlib_send_send_video_v2 = lib.func('NDIlib_send_send_video_v2', 'void', ['void*', koffi.pointer(NDIlib_video_frame_v2_t)])

// Initialize NDI
console.log('Initializing NDI...')
const initialized = NDIlib_initialize()
console.log('✓ NDI initialized:', initialized)

if (!initialized) {
  console.error('Failed to initialize NDI')
  process.exit(1)
}

// Create sender
console.log('Creating NDI sender "Open Worship Test"...')
const createSettings = {
  p_ndi_name: 'Open Worship Test',
  p_groups: null,
  clock_video: false,
  clock_audio: false
}

const sender = NDIlib_send_create(createSettings)
console.log('✓ NDI sender created:', sender ? 'success' : 'failed')

if (!sender) {
  console.error('Failed to create NDI sender')
  process.exit(1)
}

// Create a test frame (1920x1080 RGBA with a colored pattern)
const width = 1920
const height = 1080
const frameSize = width * height * 4
const frameBuffer = Buffer.alloc(frameSize)

// Fill with a gradient pattern (so we can see it in OBS)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4
    frameBuffer[offset + 0] = Math.floor((x / width) * 255)     // R
    frameBuffer[offset + 1] = Math.floor((y / height) * 255)    // G
    frameBuffer[offset + 2] = 128                                // B
    frameBuffer[offset + 3] = 200                                // A (semi-transparent)
  }
}

const FOURCC_RGBA = 0x41424752 // 'RGBA'

console.log('')
console.log('='.repeat(50))
console.log('NDI SOURCE IS NOW BROADCASTING!')
console.log('Source name: "Open Worship Test"')
console.log('='.repeat(50))
console.log('')
console.log('In OBS:')
console.log('1. Add Source → NDI Source')
console.log('2. Select "Open Worship Test" from dropdown')
console.log('3. You should see a gradient pattern')
console.log('')
console.log('Sending frames... (Ctrl+C to stop)')
console.log('')

// Send frames continuously
let frameCount = 0
const startTime = Date.now()

const interval = setInterval(() => {
  const videoFrame = {
    xres: width,
    yres: height,
    FourCC: FOURCC_RGBA,
    frame_rate_N: 30000,
    frame_rate_D: 1001,
    picture_aspect_ratio: width / height,
    frame_format_type: 1, // progressive
    timecode: BigInt(-1),
    p_data: frameBuffer,
    line_stride_in_bytes: width * 4,
    p_metadata: null,
    timestamp: BigInt(0)
  }

  try {
    NDIlib_send_send_video_v2(sender, videoFrame)
    frameCount++
    
    if (frameCount % 30 === 0) {
      const elapsed = (Date.now() - startTime) / 1000
      const fps = frameCount / elapsed
      process.stdout.write(`\rFrames sent: ${frameCount} (${fps.toFixed(1)} fps)`)
    }
  } catch (err) {
    console.error('\nError sending frame:', err)
  }
}, 33) // ~30fps

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\nStopping...')
  clearInterval(interval)
  NDIlib_send_destroy(sender)
  console.log('✓ NDI sender destroyed')
  console.log(`Total frames sent: ${frameCount}`)
  process.exit(0)
})
