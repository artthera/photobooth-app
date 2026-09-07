/**
 * Photobooth Pro - Configuration & Constants
 */
window.PhotoboothConfig = {
  LS_CONFIG_KEY: 'photobooth_pro_config_v4',
  SESSION_STORE_KEY: 'photobooth_cloud_sessions_v4',
  TOTAL_COUNT_KEY: 'photobooth_total_generated_count',
  
  // Default Settings
  defaults: {
    // 1. Branding & Teks
    eventName: "Photobooth Custom",
    tagline: "Sentuh layar untuk mulai berfoto",
    buttonText: "👋 Tap untuk Mulai",
    font: "'Poppins', system-ui, sans-serif",
    
    // 2. Beranda Kustomisasi & Layering
    homeBgMode: "camera", // 'camera' (Live Kamera Langsung) | 'image' | 'video' | 'gif' | 'none'
    homeBgData: null,
    homeBgFit: "cover",
    
    // Layer 2: Live Mirror Overlay (Photo / Animated GIF / Loop Video) with Chroma Key
    homeOverlayData: null,
    homeOverlayType: "image", // 'image' | 'gif' | 'video'
    homeOverlayChromaKey: false, // Toggle Kunci Kroma (Chroma Key Removal)
    homeOverlayChromaColor: "#00ff00", // Target Key Color (e.g. Green Screen / Black / Custom)
    homeOverlayChromaTolerance: 40, // 0 - 100
    homeOverlayChromaSmoothness: 10, // 0 - 50
    
    homeOverlayOpacity: 30, // 0 - 90%
    homeOverlayColor: "#000000",
    homeOverlayBlur: 0,
    homeTextAlign: "center",
    homeContentPos: "center",
    homeLogoSize: 3.2,
    homeLogoColor: "#ffffff",
    homeTaglineColor: "#f5f3ee",
    
    // 3. Tombol Mulai
    homeBtnBg: "#ff2a4b",
    homeBtnText: "#ffffff",
    homeBtnRadius: 999,
    homeBtnAnim: "pulse",
    
    // 4. Pengaturan Kamera & Photobooth Frames (PNG, Animated GIF, Video Loop)
    accent: "#ff2a4b",
    countdownSec: 3,
    gifIntervalSec: 0.85,
    autoResetSec: 120,
    frames: [], // Array of { name, dataUrl, type: 'png' | 'gif' | 'video' }
    
    // 5. Kustomisasi Tampilan Sesi Selesai (Result Dashboard)
    doneBgMode: "color", // 'color' | 'image' | 'gif' | 'video'
    doneBgData: null,
    doneBgFit: "cover",
    doneBgColor: "#0b0d14",
    doneBgOpacity: 30,
    
    doneBannerTitle: "✨ FOTO KAMU SUDAH SIAP! ✨",
    doneBannerSub: "Scan QR di bawah untuk mengambil semua momen terbaikmu.",
    doneBannerBg: "#ffea00",
    doneBannerText: "#000000",
    doneCardBg: "#ffffff",
    doneCardBorder: "#111827",
    doneScanTitle: "SCAN UNTUK DOWNLOAD!",
    doneScanTitleColor: "#ff2a4b",
    doneBtnStripBg: "#ff2a4b",
    doneBtnStripText: "#ffffff",
    doneBtnGifBg: "#ffea00",
    doneBtnGifText: "#000000",
    doneRestartBtnText: "🔄 FOTO LAGI / SESI BARU",
    
    // Storage
    storageProvider: 'local',
    apiEndpoint: 'https://api.yourdomain.com/photobooth',
    apiKey: ''
  },

  stripLayout: {
    width: 700,
    height: 1600,
    shots: 3,
    aspectRatio: 4 / 3,
    pad: 36,
    bottomReserve: 150,
    cornerRadius: 18
  },

  limits: {
    maxFrameSizeMb: 25,
    maxBgMediaSizeMb: 50,
    sessionExpiryHours: 48
  }
};
