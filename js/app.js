/**
 * Photobooth Pro - Master Application Controller
 * Features:
 * - High-performance full-screen camera with automatic selfie-mirror capture
 * - Retake photo on-the-fly & Interactive 3-Shot Review Screen with individual retake selection
 * - Multi-format Frame Templates (PNG Transparan, GIF Animasi Bergerak, Video Loop MP4)
 * - Custom Result Screen Background (Color / Static Photo / Animated GIF / Video Loop MP4)
 * - Layered home screen (Camera + Multi-format GIF/Video/Photo overlay with Real-time Chroma Key removal + Branding)
 * - Categorized tabbed customization settings (Beranda, Jepret, Hasil)
 * - Progressive living animated photostrip GIF generation [1, 2, 3, 2]
 */
window.AppController = (function(){
  "use strict";

  let config = {};
  let storageClient = null;
  let currentSessionId = null;
  let currentShotIndex = 0;
  const TOTAL_SHOTS = 3;
  let capturedShots = []; // 3 DataURLs (all automatically mirrored)
  let generatedGifUrl = null;
  let countdownTimer = null;
  let isCountingDown = false;
  let autoResetTimer = null;

  // Retake State
  let isReviewRetakeMode = false;
  let retakeTargetIndex = null;

  let frameIndex = 0;
  const frameImgCache = {};
  const screens = {};

  // Chroma Key Engine State
  let chromaAnimFrame = null;
  let lastChromaProcessTime = 0;

  function init(){
    loadConfig();

    storageClient = window.StorageClient.getAdapter(config.storageProvider, {
      endpoint: config.apiEndpoint,
      apiKey: config.apiKey,
      storageKey: window.PhotoboothConfig.SESSION_STORE_KEY
    });

    document.querySelectorAll('.screen').forEach(el => screens[el.id] = el);

    applyTheme();
    bindEvents();

    // Check if gallery URL parameter (?sessionId=...)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId') || urlParams.get('session');
    if(sessionId){
      goTo('screen-gallery');
      window.GalleryManager.loadSessionGallery(sessionId, storageClient);
    } else {
      goTo('screen-home');
      startHomeLiveCameraIfEnabled();
    }

    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('./sw.js').catch(()=>{});
    }
  }

  function getConfig(){
    return config;
  }

  function loadConfig(){
    try{
      const raw = localStorage.getItem(window.PhotoboothConfig.LS_CONFIG_KEY);
      config = raw ? { ...window.PhotoboothConfig.defaults, ...JSON.parse(raw) } : { ...window.PhotoboothConfig.defaults };
    }catch(e){
      config = { ...window.PhotoboothConfig.defaults };
    }
  }

  function saveConfig(){
    try{
      localStorage.setItem(window.PhotoboothConfig.LS_CONFIG_KEY, JSON.stringify(config));
    }catch(e){}
  }

  async function startHomeLiveCameraIfEnabled(){
    const bgMode = config.homeBgMode || "camera";
    const liveCam = document.getElementById('homeBgLiveCamera');
    if(bgMode === 'camera' && liveCam){
      liveCam.style.display = 'block';
      await window.CameraManager.start(liveCam);
    }
  }

  function applyTheme(){
    const root = document.documentElement.style;
    root.setProperty('--primary', config.accent || '#ff2a4b');
    root.setProperty('--font-display', config.font || "'Poppins', system-ui, sans-serif");
    
    // 1. Text & Branding (Layer 3)
    const nameEl = document.getElementById('eventName');
    if(nameEl){
      nameEl.textContent = config.eventName || window.PhotoboothConfig.defaults.eventName;
      nameEl.style.fontSize = `${config.homeLogoSize || 3.2}rem`;
      nameEl.style.color = config.homeLogoColor || "#ffffff";
    }

    const tagEl = document.getElementById('eventTagline');
    if(tagEl){
      tagEl.textContent = config.tagline || window.PhotoboothConfig.defaults.tagline;
      tagEl.style.color = config.homeTaglineColor || "#f5f3ee";
    }

    // 2. Background Media (Layer 1: Live Camera Mirror / Image / GIF / Video)
    const liveCam = document.getElementById('homeBgLiveCamera');
    const videoEl = document.getElementById('homeBgVideo');
    const imgEl = document.getElementById('homeBgImage');
    const overlayEl = document.getElementById('homeBgOverlay');
    const btnRemove = document.getElementById('btnRemoveHomeBg');
    const bgMode = config.homeBgMode || "camera";
    const fitMode = config.homeBgFit || "cover";

    if(videoEl) videoEl.style.objectFit = fitMode;
    if(imgEl) imgEl.style.objectFit = fitMode;
    if(liveCam) liveCam.style.objectFit = fitMode;

    if(bgMode === 'camera'){
      if(liveCam) liveCam.style.display = 'block';
      if(videoEl) videoEl.style.display = 'none';
      if(imgEl) imgEl.style.display = 'none';
      if(btnRemove) btnRemove.style.display = 'none';
    } else if(bgMode === 'video' && config.homeBgData){
      if(videoEl){ videoEl.src = config.homeBgData; videoEl.style.display = 'block'; }
      if(liveCam) liveCam.style.display = 'none';
      if(imgEl) imgEl.style.display = 'none';
      if(btnRemove) btnRemove.style.display = 'block';
    } else if((bgMode === 'image' || bgMode === 'gif') && config.homeBgData){
      if(imgEl){ imgEl.src = config.homeBgData; imgEl.style.display = 'block'; }
      if(liveCam) liveCam.style.display = 'none';
      if(videoEl) videoEl.style.display = 'none';
      if(btnRemove) btnRemove.style.display = 'block';
    } else {
      if(liveCam) liveCam.style.display = 'none';
      if(videoEl) videoEl.style.display = 'none';
      if(imgEl) imgEl.style.display = 'none';
      if(btnRemove) btnRemove.style.display = 'none';
    }

    // Overlay dark layer
    if(overlayEl){
      if(bgMode !== 'none'){
        overlayEl.style.display = 'block';
        const opacity = (config.homeOverlayOpacity !== undefined ? config.homeOverlayOpacity : 30) / 100;
        const color = config.homeOverlayColor || "#000000";
        overlayEl.style.backgroundColor = color;
        overlayEl.style.opacity = opacity;
        
        const blur = config.homeOverlayBlur || 0;
        overlayEl.style.backdropFilter = blur > 0 ? `blur(${blur}px)` : 'none';
        overlayEl.style.webkitBackdropFilter = blur > 0 ? `blur(${blur}px)` : 'none';
      } else {
        overlayEl.style.display = 'none';
      }
    }

    // 3. Layer 2: Live Mirror Overlay with Chroma Key Engine
    renderHomeOverlay();

    // 4. Layout Alignment (Layer 3)
    const homeScreen = document.getElementById('screen-home');
    const homeInner = document.getElementById('homeInner');
    if(homeScreen && homeInner){
      homeInner.style.textAlign = config.homeTextAlign || "center";
      
      if(config.homeContentPos === 'top'){
        homeScreen.style.justifyContent = 'flex-start';
        homeInner.style.paddingTop = '60px';
        homeInner.style.paddingBottom = '20px';
      } else if(config.homeContentPos === 'bottom'){
        homeScreen.style.justifyContent = 'flex-end';
        homeInner.style.paddingTop = '20px';
        homeInner.style.paddingBottom = '60px';
      } else {
        homeScreen.style.justifyContent = 'center';
        homeInner.style.paddingTop = '24px';
        homeInner.style.paddingBottom = '24px';
      }
    }

    // 5. Start Button Customization
    const startBtn = document.getElementById('btnStartSession');
    if(startBtn){
      startBtn.textContent = config.buttonText || "👋 Tap untuk Mulai";
      startBtn.style.backgroundColor = config.homeBtnBg || "#ff2a4b";
      startBtn.style.color = config.homeBtnText || "#ffffff";
      startBtn.style.borderRadius = `${config.homeBtnRadius !== undefined ? config.homeBtnRadius : 999}px`;
      startBtn.className = 'tap-badge ' + (config.homeBtnAnim || 'pulse');
    }
  }

  /* ================= CHROMA KEY & MULTI-FORMAT OVERLAY ENGINE ================= */
  function renderHomeOverlay(){
    stopChromaKeyLoop();

    const overlayImg = document.getElementById('homeOverlayImage');
    const overlayVid = document.getElementById('homeOverlayVideo');
    const overlayCanvas = document.getElementById('homeOverlayCanvas');
    const btnRemove = document.getElementById('btnRemoveHomeOverlay');

    if(!config.homeOverlayData){
      if(overlayImg) overlayImg.style.display = 'none';
      if(overlayVid) overlayVid.style.display = 'none';
      if(overlayCanvas) overlayCanvas.style.display = 'none';
      if(btnRemove) btnRemove.style.display = 'none';
      return;
    }

    if(btnRemove) btnRemove.style.display = 'block';
    const isVideo = config.homeOverlayType === 'video';
    const isChroma = !!config.homeOverlayChromaKey;

    if(isChroma){
      if(overlayImg) overlayImg.style.display = 'none';
      if(overlayVid) overlayVid.style.display = 'none';
      if(overlayCanvas){
        overlayCanvas.style.display = 'block';
        startChromaKeyLoop();
      }
    } else {
      if(overlayCanvas) overlayCanvas.style.display = 'none';
      if(isVideo){
        if(overlayImg) overlayImg.style.display = 'none';
        if(overlayVid){
          if(overlayVid.src !== config.homeOverlayData) overlayVid.src = config.homeOverlayData;
          overlayVid.style.display = 'block';
          overlayVid.play().catch(()=>{});
        }
      } else {
        if(overlayVid) overlayVid.style.display = 'none';
        if(overlayImg){
          overlayImg.src = config.homeOverlayData;
          overlayImg.style.display = 'block';
        }
      }
    }
  }

  function startChromaKeyLoop(){
    stopChromaKeyLoop();

    const overlayCanvas = document.getElementById('homeOverlayCanvas');
    if(!overlayCanvas) return;
    const ctx = overlayCanvas.getContext('2d', { willReadFrequently: true });

    const isVideo = config.homeOverlayType === 'video';
    let sourceMedia = null;

    if(isVideo){
      sourceMedia = document.getElementById('homeOverlayVideo');
      if(sourceMedia){
        if(sourceMedia.src !== config.homeOverlayData) sourceMedia.src = config.homeOverlayData;
        sourceMedia.play().catch(()=>{});
      }
    } else {
      sourceMedia = document.getElementById('homeOverlayImage');
      if(sourceMedia && sourceMedia.src !== config.homeOverlayData){
        sourceMedia.src = config.homeOverlayData;
      }
    }

    const keyColorHex = config.homeOverlayChromaColor || "#00ff00";
    const tolerance = config.homeOverlayChromaTolerance !== undefined ? config.homeOverlayChromaTolerance : 40;
    const smoothness = config.homeOverlayChromaSmoothness !== undefined ? config.homeOverlayChromaSmoothness : 10;

    const kr = parseInt(keyColorHex.slice(1, 3), 16) || 0;
    const kg = parseInt(keyColorHex.slice(3, 5), 16) || 255;
    const kb = parseInt(keyColorHex.slice(5, 7), 16) || 0;

    const tol = tolerance * 2.55;
    const tolSq = tol * tol;
    const smooth = (smoothness || 1) * 2.55;
    const smoothSq = (tol + smooth) * (tol + smooth);

    function processFrame(time){
      if(sourceMedia && ((isVideo && sourceMedia.readyState >= 2) || (!isVideo && sourceMedia.complete))){
        if(time - lastChromaProcessTime > 30){
          lastChromaProcessTime = time;
          
          const w = sourceMedia.videoWidth || sourceMedia.naturalWidth || 640;
          const h = sourceMedia.videoHeight || sourceMedia.naturalHeight || 360;

          if(overlayCanvas.width !== w || overlayCanvas.height !== h){
            overlayCanvas.width = w;
            overlayCanvas.height = h;
          }

          ctx.drawImage(sourceMedia, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;

          for(let i = 0; i < data.length; i += 4){
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            const dSq = (r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2;

            if(dSq <= tolSq){
              data[i+3] = 0;
            } else if(dSq < smoothSq){
              const alphaFactor = (Math.sqrt(dSq) - tol) / (smooth || 1);
              data[i+3] = Math.min(data[i+3], Math.round(data[i+3] * Math.max(0, Math.min(1, alphaFactor))));
            }
          }

          ctx.putImageData(imgData, 0, 0);
        }
      }

      chromaAnimFrame = requestAnimationFrame(processFrame);
    }

    chromaAnimFrame = requestAnimationFrame(processFrame);
  }

  function stopChromaKeyLoop(){
    if(chromaAnimFrame){
      cancelAnimationFrame(chromaAnimFrame);
      chromaAnimFrame = null;
    }
  }

  function goTo(id){
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if(screens[id]) screens[id].classList.add('active');

    clearTimeout(autoResetTimer);
    if(id === 'screen-done'){
      const timeoutSec = config.autoResetSec || 120;
      autoResetTimer = setTimeout(() => {
        restartSession();
      }, timeoutSec * 1000);
    }
  }

  /* ================= CAPTURE SESSION ================= */
  async function beginSession(){
    currentSessionId = window.PhotoboothUtils.generateSessionId();
    currentShotIndex = 0;
    capturedShots = [];
    generatedGifUrl = null;
    isReviewRetakeMode = false;
    retakeTargetIndex = null;

    const videoEl = document.getElementById('videoJepret');
    window.CameraManager.setFilter('none');

    document.querySelectorAll('.filter-item').forEach(f => {
      f.classList.toggle('active', f.dataset.filter === 'none');
    });
    document.getElementById('filterRowWrap').style.display = 'flex';

    for(let i=0; i<TOTAL_SHOTS; i++){
      const slot = document.getElementById('slotCard' + i);
      slot.className = 'slot-card' + (i === 0 ? ' active' : '');
      slot.innerHTML = '<span class="slot-icon">📷</span><span class="retake-hint">🔄 Ulang</span>';
    }

    const ok = await window.CameraManager.start(videoEl, (msg) => {
      const sub = document.getElementById('jepretSub');
      if(sub) sub.textContent = msg;
    });

    if(!ok) return;

    updateCaptureUI();
    goTo('screen-jepret');
  }

  function updateCaptureUI(){
    const sub = document.getElementById('jepretSub');
    const title = document.getElementById('jepretTitle');
    const shutter = document.getElementById('btnShutter');
    const btnRetakeLast = document.getElementById('btnRetakeLastShot');

    if(isReviewRetakeMode){
      title.textContent = `Foto Ulang: Foto ${currentShotIndex + 1}`;
      sub.textContent = `Sentuh tombol kamera untuk mengambil ulang Foto ${currentShotIndex + 1}`;
      if(btnRetakeLast) btnRetakeLast.style.display = 'none';
    } else {
      title.textContent = `Foto ${currentShotIndex + 1} dari ${TOTAL_SHOTS}`;
      if(currentShotIndex === 0){
        document.getElementById('filterRowWrap').style.display = 'flex';
        sub.textContent = 'Pilih filter di tengah bawah, lalu sentuh tombol kamera';
        if(btnRetakeLast) btnRetakeLast.style.display = 'none';
      } else {
        document.getElementById('filterRowWrap').style.display = 'none';
        sub.textContent = `Foto ${currentShotIndex} tersimpan! Sentuh tombol untuk Foto ${currentShotIndex + 1}`;
        if(btnRetakeLast){
          btnRetakeLast.textContent = `🔄 Ulang Foto ${currentShotIndex}`;
          btnRetakeLast.style.display = 'block';
        }
      }
    }

    for(let i=0; i<TOTAL_SHOTS; i++){
      const slot = document.getElementById('slotCard' + i);
      if(i === currentShotIndex) slot.classList.add('active');
      else slot.classList.remove('active');
    }

    shutter.disabled = false;
  }

  function retakeSpecificShot(index){
    if(index < 0 || index >= TOTAL_SHOTS) return;
    retakeTargetIndex = index;
    currentShotIndex = index;
    isReviewRetakeMode = true;

    updateCaptureUI();
    goTo('screen-jepret');
  }

  function startShotCountdown(){
    if(isCountingDown) return;
    isCountingDown = true;

    const shutter = document.getElementById('btnShutter');
    const numEl = document.getElementById('jepretNum');
    const btnRetakeLast = document.getElementById('btnRetakeLastShot');
    shutter.disabled = true;
    if(btnRetakeLast) btnRetakeLast.style.display = 'none';

    let n = config.countdownSec || 3;
    numEl.textContent = n;
    numEl.className = 'countdown-num active';
    window.AudioManager.playCountdown(n);

    countdownTimer = setInterval(() => {
      n--;
      if(n <= 0){
        clearInterval(countdownTimer);
        numEl.textContent = '';
        numEl.className = 'countdown-num';
        takeSnapshot();
      } else {
        numEl.textContent = n;
        numEl.className = 'countdown-num active';
        window.AudioManager.playCountdown(n);
      }
    }, 1000);
  }

  function takeSnapshot(){
    const workCanvas = document.getElementById('workCanvas');
    const flash = document.getElementById('flashEl');

    window.AudioManager.playShutterSound();

    const dataUrl = window.CameraManager.takeSnapshot(workCanvas);
    if(!dataUrl) return;

    capturedShots[currentShotIndex] = dataUrl;

    const currentSlot = document.getElementById('slotCard' + currentShotIndex);
    if(currentSlot){
      currentSlot.classList.add('filled');
      currentSlot.innerHTML = `<img src="${dataUrl}" alt="Shot ${currentShotIndex + 1}"><span class="retake-hint">🔄 Ulang</span>`;
    }

    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');

    isCountingDown = false;

    if(isReviewRetakeMode){
      isReviewRetakeMode = false;
      retakeTargetIndex = null;
      renderReviewScreen();
    } else {
      if(currentShotIndex < TOTAL_SHOTS - 1){
        currentShotIndex++;
        updateCaptureUI();
      } else {
        renderReviewScreen();
      }
    }
  }

  /* ================= 2B. REVIEW 3 FOTO SCREEN ================= */
  function renderReviewScreen(){
    for(let i=0; i<TOTAL_SHOTS; i++){
      const imgEl = document.getElementById('reviewImg' + i);
      if(imgEl && capturedShots[i]){
        imgEl.src = capturedShots[i];
      }
    }
    goTo('screen-review-shots');
  }

  /* ================= FRAME PICKER (PNG / GIF / VIDEO LOOP) ================= */
  function loadImage(src){
    return new Promise((resolve, reject) => {
      if(frameImgCache[src]){ resolve(frameImgCache[src]); return; }
      const img = new Image();
      img.onload = () => { frameImgCache[src] = img; resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function goToFramePicker(){
    frameIndex = 0;
    renderFrameDots();
    renderFramePreview();
    goTo('screen-frame');
  }

  function renderFrameDots(){
    const dotsWrap = document.getElementById('frameDots');
    dotsWrap.innerHTML = '';
    const total = Math.max(config.frames.length, 1);
    for(let i=0; i<total; i++){
      const b = document.createElement('button');
      b.className = 'dot' + (i === frameIndex ? ' active' : '');
      b.onclick = () => { frameIndex = i; renderFrameDots(); renderFramePreview(); };
      dotsWrap.appendChild(b);
    }
  }

  /**
   * Renders the 3 vertical photos on canvas with PNG/GIF/Video frame overlays
   */
  async function renderFramePreview(){
    const frameCanvas = document.getElementById('frameCanvas');
    const frameCtx = frameCanvas.getContext('2d');
    const layout = window.PhotoboothConfig.stripLayout;

    const overlayGif = document.getElementById('frameOverlayGif');
    const overlayVid = document.getElementById('frameOverlayVideo');

    const total = Math.max(config.frames.length, 1);
    document.getElementById('frameStepPill').textContent = (frameIndex+1) + ' / ' + total;
    
    const activeFrame = config.frames.length ? config.frames[frameIndex] : null;
    document.getElementById('frameSubtitle').textContent = activeFrame
      ? `${activeFrame.name || ('Frame ' + (frameIndex+1))} (${(activeFrame.type || 'PNG').toUpperCase()})`
      : 'Strip 3 Foto Vertikal';

    const W = layout.width;
    const H = layout.height;
    frameCanvas.width = W;
    frameCanvas.height = H;
    frameCtx.clearRect(0, 0, W, H);
    
    // 1. Base Background Color
    frameCtx.fillStyle = config.doneCardBg || "#ffffff";
    frameCtx.fillRect(0, 0, W, H);

    // 2. Draw all 3 mirrored photos
    await drawVerticalStripShots(frameCtx, W, H, layout, 3);

    // 3. Multi-Format Frame Overlay
    if(activeFrame && activeFrame.dataUrl){
      const frameType = activeFrame.type || (activeFrame.dataUrl.startsWith('data:video/') ? 'video' : (activeFrame.dataUrl.includes('image/gif') ? 'gif' : 'png'));

      if(frameType === 'video'){
        if(overlayVid){
          if(overlayVid.src !== activeFrame.dataUrl) overlayVid.src = activeFrame.dataUrl;
          overlayVid.style.display = 'block';
          overlayVid.play().catch(()=>{});
        }
        if(overlayGif) overlayGif.style.display = 'none';
      } else if(frameType === 'gif'){
        if(overlayGif){
          overlayGif.src = activeFrame.dataUrl;
          overlayGif.style.display = 'block';
        }
        if(overlayVid) overlayVid.style.display = 'none';
      } else {
        // PNG Static Frame
        if(overlayGif) overlayGif.style.display = 'none';
        if(overlayVid) overlayVid.style.display = 'none';
        try{
          const frameImg = await loadImage(activeFrame.dataUrl);
          frameCtx.drawImage(frameImg, 0, 0, W, H);
        }catch(e){
          console.warn('[FrameRenderer] Failed to draw PNG frame:', e);
        }
      }
    } else {
      if(overlayGif) overlayGif.style.display = 'none';
      if(overlayVid) overlayVid.style.display = 'none';
    }
  }

  async function buildGifStripCanvas(limitShots){
    const layout = window.PhotoboothConfig.stripLayout;
    const W = layout.width;
    const H = layout.height;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Base background
    ctx.fillStyle = config.doneCardBg || "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // 2. Draw shots up to limitShots
    await drawVerticalStripShots(ctx, W, H, layout, limitShots);

    // 3. Frame Overlay
    if(config.frames && config.frames.length && config.frames[frameIndex]){
      const f = config.frames[frameIndex];
      try{
        if(f.type === 'video'){
          const vid = document.getElementById('frameOverlayVideo');
          if(vid && vid.readyState >= 2){
            ctx.drawImage(vid, 0, 0, W, H);
          }
        } else {
          const frameImg = await loadImage(f.dataUrl);
          ctx.drawImage(frameImg, 0, 0, W, H);
        }
      }catch(e){
        console.warn('[GifBuilder] Failed to overlay frame:', e);
      }
    }

    return canvas;
  }

  async function drawVerticalStripShots(ctx, W, H, layout, limitShots = 3){
    const shots = capturedShots.slice(0, limitShots).filter(Boolean);
    if(!shots.length) return;

    const pad = layout.pad;
    const bottomReserve = layout.bottomReserve;
    const usableHeight = H - bottomReserve - (pad * 4);
    const cellH = usableHeight / 3;
    const cellW = W - (pad * 2);

    for(let i=0; i<shots.length; i++){
      const img = await loadImage(shots[i]);
      const x = pad;
      const y = pad + i * (cellH + pad);
      drawImageCover(ctx, img, x, y, cellW, cellH, layout.cornerRadius);
    }

    ctx.fillStyle = "#111827";
    ctx.font = `bold 28px ${config.font || 'Poppins'}`;
    ctx.textAlign = "center";
    ctx.fillText(config.eventName || "Photobooth Custom", W / 2, H - 75);

    ctx.font = `18px ${config.font || 'Poppins'}`;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(window.PhotoboothUtils.formatDate(Date.now()), W / 2, H - 45);
  }

  function generateStripGif(){
    return new Promise(async (resolve) => {
      if(typeof gifshot === 'undefined' || !capturedShots.length){
        console.warn('[GIF] gifshot library not available or no captured shots');
        resolve(null);
        return;
      }

      try{
        const seq = [1, 2, 3, 2];
        const images = [];

        for(const limit of seq){
          const c = await buildGifStripCanvas(limit);
          images.push(c.toDataURL('image/jpeg', 0.85));
        }

        gifshot.createGIF({
          images: images,
          gifWidth: 420,
          gifHeight: 960,
          interval: 0.85,
          numWorkers: 2
        }, function(obj){
          if(!obj.error && obj.image){
            generatedGifUrl = obj.image;
            resolve(obj.image);
          } else {
            console.warn('[GIF] gifshot error:', obj.error);
            resolve(null);
          }
        });
      }catch(err){
        console.error('[GIF] Failed to generate strip GIF:', err);
        resolve(null);
      }
    });
  }

  function drawImageCover(ctx, img, x, y, w, h, radius){
    ctx.save();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.clip();
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dw ? dx : x, dh ? dy : y, dw, dh);
    ctx.restore();
  }

  function roundRectPath(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  /* ================= FINAL RESULTS SCREEN ================= */
  async function renderDoneScreen(){
    showLoader(true, "Membuat Animasi GIF Strip & Menyiapkan QR...");

    await renderFramePreview();
    const frameCanvas = document.getElementById('frameCanvas');
    const fullStripUrl = frameCanvas.toDataURL('image/png');

    await generateStripGif();

    const sessionPayload = {
      sessionId: currentSessionId,
      timestamp: Date.now(),
      fullStripUrl: fullStripUrl,
      liveVideoUrl: generatedGifUrl,
      individualPhotos: [...capturedShots]
    };

    try{
      await storageClient.createSession(sessionPayload);
    }catch(err){
      console.warn('[Storage] Save error:', err);
    }

    showLoader(false);

    const doneScreen = document.getElementById('screen-done');
    window.GalleryManager.renderCompleteDashboard(doneScreen, sessionPayload, false, config);

    goTo('screen-done');
  }

  function restartSession(){
    capturedShots = [];
    generatedGifUrl = null;
    isReviewRetakeMode = false;
    retakeTargetIndex = null;
    goTo('screen-home');
    startHomeLiveCameraIfEnabled();
  }

  function showLoader(show, text){
    const el = document.getElementById('loaderOverlay');
    if(show){
      document.getElementById('loaderText').textContent = text || 'Memproses...';
      el.classList.add('active');
    }else{
      el.classList.remove('active');
    }
  }

  /* ================= BIND EVENTS ================= */
  function bindEvents(){
    document.getElementById('btnStartSession').onclick = () => {
      window.AudioManager.init();
      beginSession();
    };

    document.querySelectorAll('.filter-item').forEach(item => {
      item.onclick = () => {
        if(currentShotIndex > 0 && !isReviewRetakeMode) return;
        document.querySelectorAll('.filter-item').forEach(f => f.classList.remove('active'));
        item.classList.add('active');
        window.CameraManager.setFilter(item.dataset.filter);
      };
    });

    document.getElementById('btnShutter').onclick = () => {
      startShotCountdown();
    };

    const btnRetakeLast = document.getElementById('btnRetakeLastShot');
    if(btnRetakeLast){
      btnRetakeLast.onclick = () => {
        if(currentShotIndex > 0){
          retakeSpecificShot(currentShotIndex - 1);
        }
      };
    }

    document.querySelectorAll('.slot-card').forEach(card => {
      card.onclick = () => {
        const slotIdx = parseInt(card.dataset.slot, 10);
        if(capturedShots[slotIdx]){
          retakeSpecificShot(slotIdx);
        }
      };
    });

    document.getElementById('btnCancelSession').onclick = () => {
      if(countdownTimer) clearInterval(countdownTimer);
      restartSession();
    };

    // Review Screen Actions
    document.getElementById('btnRetakeShot0').onclick = () => retakeSpecificShot(0);
    document.getElementById('btnRetakeShot1').onclick = () => retakeSpecificShot(1);
    document.getElementById('btnRetakeShot2').onclick = () => retakeSpecificShot(2);

    document.getElementById('btnConfirmReviewGoToFrames').onclick = () => {
      goToFramePicker();
    };

    document.getElementById('btnRetakeAllShots').onclick = () => {
      beginSession();
    };

    // Frame Screen Nav
    document.getElementById('btnFramePrev').onclick = () => {
      const total = Math.max(config.frames.length, 1);
      frameIndex = (frameIndex - 1 + total) % total;
      renderFrameDots(); renderFramePreview();
    };
    document.getElementById('btnFrameNext').onclick = () => {
      const total = Math.max(config.frames.length, 1);
      frameIndex = (frameIndex + 1) % total;
      renderFrameDots(); renderFramePreview();
    };

    document.getElementById('btnBackToReviewShots').onclick = () => {
      renderReviewScreen();
    };

    document.getElementById('btnGoToDone').onclick = async () => {
      await renderDoneScreen();
    };

    // Settings Modal
    document.getElementById('btnOpenSettings').onclick = () => {
      fillSettingsForm();
      document.getElementById('panelBackdrop').classList.add('open');
    };
    document.getElementById('btnCloseSettings').onclick = () => {
      document.getElementById('panelBackdrop').classList.remove('open');
    };

    // Tab Navigation for Settings Categories (Beranda, Jepret, Hasil)
    document.querySelectorAll('.tab-nav-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.tab-nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.settings-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        const targetPane = document.getElementById(targetId);
        if(targetPane) targetPane.classList.add('active');
      };
    });

    // Sliders live values
    const sliderOpacity = document.getElementById('inpOverlayOpacity');
    const valOpacity = document.getElementById('valOverlayOpacity');
    if(sliderOpacity && valOpacity){
      sliderOpacity.oninput = () => valOpacity.textContent = `${sliderOpacity.value}%`;
    }

    const sliderBlur = document.getElementById('inpOverlayBlur');
    const valBlur = document.getElementById('valOverlayBlur');
    if(sliderBlur && valBlur){
      sliderBlur.oninput = () => valBlur.textContent = `${sliderBlur.value}px`;
    }

    const sliderLogoSize = document.getElementById('inpLogoSize');
    const valLogoSize = document.getElementById('valLogoSize');
    if(sliderLogoSize && valLogoSize){
      sliderLogoSize.oninput = () => valLogoSize.textContent = `${sliderLogoSize.value}rem`;
    }

    const sliderDoneBgOp = document.getElementById('inpDoneBgOpacity');
    const valDoneBgOp = document.getElementById('valDoneBgOpacity');
    if(sliderDoneBgOp && valDoneBgOp){
      sliderDoneBgOp.oninput = () => valDoneBgOp.textContent = `${sliderDoneBgOp.value}%`;
    }

    // Multi-format Frame Upload (PNG, GIF, Video Loop)
    document.getElementById('inpFrameFiles').onchange = (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach(file => {
        const isVideo = file.type.startsWith('video/');
        const isGif = file.type === 'image/gif';
        const type = isVideo ? 'video' : (isGif ? 'gif' : 'png');

        const reader = new FileReader();
        reader.onload = () => {
          config.frames.push({
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl: reader.result,
            type: type
          });
          renderFrameChips();
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };

    // Result Dashboard Background Media Upload (Photo / GIF / Video)
    const inpDoneBg = document.getElementById('inpDoneBgFile');
    if(inpDoneBg){
      inpDoneBg.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const isVideo = file.type.startsWith('video/');
        const isGif = file.type === 'image/gif';
        const mode = isVideo ? 'video' : (isGif ? 'gif' : 'image');

        const reader = new FileReader();
        reader.onload = () => {
          config.doneBgMode = mode;
          config.doneBgData = reader.result;
          document.getElementById('inpDoneBgMode').value = mode;
          const btnRem = document.getElementById('btnRemoveDoneBg');
          if(btnRem) btnRem.style.display = 'block';
          alert(`Background Halaman Hasil (${mode.toUpperCase()}) berhasil dimuat.`);
        };
        reader.readAsDataURL(file);
      };
    }

    const btnRemoveDoneBg = document.getElementById('btnRemoveDoneBg');
    if(btnRemoveDoneBg){
      btnRemoveDoneBg.onclick = () => {
        config.doneBgMode = 'color';
        config.doneBgData = null;
        document.getElementById('inpDoneBgMode').value = 'color';
        btnRemoveDoneBg.style.display = 'none';
        alert('Background Halaman Hasil diatur kembali ke warna default.');
      };
    }

    // Home Live Mirror Overlay Upload (Photo / GIF / Video)
    const inpHomeOverlay = document.getElementById('inpHomeOverlayFile');
    if(inpHomeOverlay){
      inpHomeOverlay.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;

        const isVideo = file.type.startsWith('video/');
        const isGif = file.type === 'image/gif';
        const maxMb = isVideo ? window.PhotoboothConfig.limits.maxBgMediaSizeMb : 25;

        if(file.size > maxMb * 1024 * 1024){
          alert(`Ukuran file melebihi batas maksimal ${maxMb}MB.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          config.homeOverlayType = isVideo ? 'video' : (isGif ? 'gif' : 'image');
          config.homeOverlayData = reader.result;
          applyTheme();
          alert(`Overlay ${isVideo ? 'Video Loop' : (isGif ? 'GIF Animasi' : 'Foto')} berhasil dipasang.`);
        };
        reader.readAsDataURL(file);
      };
    }

    const btnRemoveOverlay = document.getElementById('btnRemoveHomeOverlay');
    if(btnRemoveOverlay){
      btnRemoveOverlay.onclick = () => {
        config.homeOverlayData = null;
        applyTheme();
        alert('Overlay live cermin beranda telah dihapus.');
      };
    }

    // Chroma Key Toggle & Controls
    const chkChroma = document.getElementById('inpChromaKeyToggle');
    const chromaWrap = document.getElementById('chromaSettingsWrap');
    if(chkChroma && chromaWrap){
      chkChroma.onchange = () => {
        config.homeOverlayChromaKey = chkChroma.checked;
        chromaWrap.style.display = chkChroma.checked ? 'block' : 'none';
        renderHomeOverlay();
      };
    }

    const inpChromaColor = document.getElementById('inpChromaColor');
    if(inpChromaColor){
      inpChromaColor.oninput = () => {
        config.homeOverlayChromaColor = inpChromaColor.value;
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }

    const btnPresetGreen = document.getElementById('btnChromaPresetGreen');
    if(btnPresetGreen){
      btnPresetGreen.onclick = () => {
        config.homeOverlayChromaColor = "#00ff00";
        if(inpChromaColor) inpChromaColor.value = "#00ff00";
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }
    const btnPresetBlack = document.getElementById('btnChromaPresetBlack');
    if(btnPresetBlack){
      btnPresetBlack.onclick = () => {
        config.homeOverlayChromaColor = "#000000";
        if(inpChromaColor) inpChromaColor.value = "#00ff00";
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }
    const btnPresetWhite = document.getElementById('btnChromaPresetWhite');
    if(btnPresetWhite){
      btnPresetWhite.onclick = () => {
        config.homeOverlayChromaColor = "#ffffff";
        if(inpChromaColor) inpChromaColor.value = "#ffffff";
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }

    const inpChromaTol = document.getElementById('inpChromaTolerance');
    const valChromaTol = document.getElementById('valChromaTolerance');
    if(inpChromaTol && valChromaTol){
      inpChromaTol.oninput = () => {
        valChromaTol.textContent = inpChromaTol.value;
        config.homeOverlayChromaTolerance = parseInt(inpChromaTol.value, 10);
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }

    const inpChromaSmooth = document.getElementById('inpChromaSmooth');
    const valChromaSmooth = document.getElementById('valChromaSmooth');
    if(inpChromaSmooth && valChromaSmooth){
      inpChromaSmooth.oninput = () => {
        valChromaSmooth.textContent = inpChromaSmooth.value;
        config.homeOverlayChromaSmoothness = parseInt(inpChromaSmooth.value, 10);
        if(config.homeOverlayChromaKey) renderHomeOverlay();
      };
    }

    // Background Full Desktop Upload
    document.getElementById('inpHomeBgFile').onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      
      const isVideo = file.type.startsWith('video/');
      const isGif = file.type === 'image/gif';
      const maxMb = isVideo ? window.PhotoboothConfig.limits.maxBgMediaSizeMb : 25;

      if(file.size > maxMb * 1024 * 1024){
        alert(`Ukuran file melebihi batas maksimal ${maxMb}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        config.homeBgMode = isVideo ? 'video' : (isGif ? 'gif' : 'image');
        config.homeBgData = reader.result;
        document.getElementById('inpHomeBgMode').value = config.homeBgMode;
        alert(`Latar belakang ${isVideo ? 'Video' : (isGif ? 'GIF Animasi' : 'Foto')} berhasil dimuat.`);
      };
      reader.readAsDataURL(file);
    };

    document.getElementById('btnRemoveHomeBg').onclick = () => {
      config.homeBgMode = 'camera';
      config.homeBgData = null;
      document.getElementById('inpHomeBgMode').value = 'camera';
      document.getElementById('btnRemoveHomeBg').style.display = 'none';
      alert('Background diatur kembali ke Live Kamera.');
    };

    // Apply Settings
    document.getElementById('btnApplySettings').onclick = () => {
      config.eventName = window.PhotoboothUtils.sanitizeText(document.getElementById('inpEventName').value.trim()) || window.PhotoboothConfig.defaults.eventName;
      config.tagline = window.PhotoboothUtils.sanitizeText(document.getElementById('inpTagline').value.trim()) || window.PhotoboothConfig.defaults.tagline;
      config.buttonText = window.PhotoboothUtils.sanitizeText(document.getElementById('inpButtonText').value.trim()) || "👋 Tap untuk Mulai";
      config.font = document.getElementById('inpFontFamily').value;
      
      config.homeBgMode = document.getElementById('inpHomeBgMode').value;
      config.homeBgFit = document.getElementById('inpBgFit').value;
      config.homeOverlayColor = document.getElementById('inpOverlayColor').value;
      config.homeOverlayOpacity = parseInt(document.getElementById('inpOverlayOpacity').value, 10);
      config.homeOverlayBlur = parseInt(document.getElementById('inpOverlayBlur').value, 10);
      
      config.homeContentPos = document.getElementById('inpContentPos').value;
      config.homeTextAlign = document.getElementById('inpTextAlign').value;
      config.homeLogoSize = parseFloat(document.getElementById('inpLogoSize').value);
      config.homeLogoColor = document.getElementById('inpLogoColor').value;
      config.homeTaglineColor = document.getElementById('inpTaglineColor').value;

      config.homeBtnBg = document.getElementById('inpBtnBg').value;
      config.homeBtnText = document.getElementById('inpBtnText').value;
      config.homeBtnRadius = parseInt(document.getElementById('inpBtnRadius').value, 10);
      config.homeBtnAnim = document.getElementById('inpBtnAnim').value;

      config.accent = document.getElementById('inpBtnBg').value;
      config.countdownSec = Math.min(10, Math.max(1, parseInt(document.getElementById('inpCountdown').value, 10) || 3));

      // Done Screen Background & Styling
      config.doneBgMode = document.getElementById('inpDoneBgMode').value;
      config.doneBgFit = document.getElementById('inpDoneBgFit').value;
      config.doneBgOpacity = parseInt(document.getElementById('inpDoneBgOpacity').value, 10);

      config.doneBannerTitle = window.PhotoboothUtils.sanitizeText(document.getElementById('inpDoneBannerTitle').value.trim()) || window.PhotoboothConfig.defaults.doneBannerTitle;
      config.doneBannerSub = window.PhotoboothUtils.sanitizeText(document.getElementById('inpDoneBannerSub').value.trim()) || window.PhotoboothConfig.defaults.doneBannerSub;
      config.doneBannerBg = document.getElementById('inpDoneBannerBg').value;
      config.doneBannerText = document.getElementById('inpDoneBannerText').value;
      config.doneCardBg = document.getElementById('inpDoneCardBg').value;
      config.doneCardBorder = document.getElementById('inpDoneCardBorder').value;
      config.doneScanTitle = window.PhotoboothUtils.sanitizeText(document.getElementById('inpDoneScanTitle').value.trim()) || "SCAN UNTUK DOWNLOAD!";
      config.doneScanTitleColor = document.getElementById('inpDoneScanTitleColor').value;
      config.doneBtnStripBg = document.getElementById('inpDoneBtnStripBg').value;
      config.doneBtnGifBg = document.getElementById('inpDoneBtnGifBg').value;
      config.doneRestartBtnText = window.PhotoboothUtils.sanitizeText(document.getElementById('inpDoneRestartBtnText').value.trim()) || "🔄 FOTO LAGI / SESI BARU";

      saveConfig();
      applyTheme();
      startHomeLiveCameraIfEnabled();
      document.getElementById('panelBackdrop').classList.remove('open');
    };
  }

  function fillSettingsForm(){
    document.getElementById('inpEventName').value = config.eventName || "";
    document.getElementById('inpTagline').value = config.tagline || "";
    document.getElementById('inpButtonText').value = config.buttonText || "👋 Tap untuk Mulai";
    document.getElementById('inpFontFamily').value = config.font || "'Poppins', system-ui, sans-serif";

    document.getElementById('inpHomeBgMode').value = config.homeBgMode || "camera";
    document.getElementById('inpBgFit').value = config.homeBgFit || "cover";
    document.getElementById('inpOverlayColor').value = config.homeOverlayColor || "#000000";
    
    const opVal = config.homeOverlayOpacity !== undefined ? config.homeOverlayOpacity : 30;
    document.getElementById('inpOverlayOpacity').value = opVal;
    document.getElementById('valOverlayOpacity').textContent = `${opVal}%`;

    const blurVal = config.homeOverlayBlur || 0;
    document.getElementById('inpOverlayBlur').value = blurVal;
    document.getElementById('valOverlayBlur').textContent = `${blurVal}px`;

    document.getElementById('inpContentPos').value = config.homeContentPos || "center";
    document.getElementById('inpTextAlign').value = config.homeTextAlign || "center";
    
    const lSize = config.homeLogoSize || 3.2;
    document.getElementById('inpLogoSize').value = lSize;
    document.getElementById('valLogoSize').textContent = `${lSize}rem`;

    document.getElementById('inpLogoColor').value = config.homeLogoColor || "#ffffff";
    document.getElementById('inpTaglineColor').value = config.homeTaglineColor || "#f5f3ee";

    document.getElementById('inpBtnBg').value = config.homeBtnBg || "#ff2a4b";
    document.getElementById('inpBtnText').value = config.homeBtnText || "#ffffff";
    document.getElementById('inpBtnRadius').value = config.homeBtnRadius !== undefined ? config.homeBtnRadius : 999;
    document.getElementById('inpBtnAnim').value = config.homeBtnAnim || "pulse";

    document.getElementById('inpCountdown').value = config.countdownSec || 3;

    // Done Screen Settings
    document.getElementById('inpDoneBgMode').value = config.doneBgMode || "color";
    document.getElementById('inpDoneBgFit').value = config.doneBgFit || "cover";
    const doneOpVal = config.doneBgOpacity !== undefined ? config.doneBgOpacity : 35;
    document.getElementById('inpDoneBgOpacity').value = doneOpVal;
    document.getElementById('valDoneBgOpacity').textContent = `${doneOpVal}%`;

    const btnRemDoneBg = document.getElementById('btnRemoveDoneBg');
    if(btnRemDoneBg){
      btnRemDoneBg.style.display = (config.doneBgMode !== 'color' && config.doneBgData) ? 'block' : 'none';
    }

    document.getElementById('inpDoneBannerTitle').value = config.doneBannerTitle || "✨ FOTO KAMU SUDAH SIAP! ✨";
    document.getElementById('inpDoneBannerSub').value = config.doneBannerSub || "Scan QR di bawah untuk mengambil semua momen terbaikmu.";
    document.getElementById('inpDoneBannerBg').value = config.doneBannerBg || "#ffea00";
    document.getElementById('inpDoneBannerText').value = config.doneBannerText || "#000000";
    document.getElementById('inpDoneCardBg').value = config.doneCardBg || "#ffffff";
    document.getElementById('inpDoneCardBorder').value = config.doneCardBorder || "#111827";
    document.getElementById('inpDoneScanTitle').value = config.doneScanTitle || "SCAN UNTUK DOWNLOAD!";
    document.getElementById('inpDoneScanTitleColor').value = config.doneScanTitleColor || "#ff2a4b";
    document.getElementById('inpDoneBtnStripBg').value = config.doneBtnStripBg || "#ff2a4b";
    document.getElementById('inpDoneBtnGifBg').value = config.doneBtnGifBg || "#ffea00";
    document.getElementById('inpDoneRestartBtnText').value = config.doneRestartBtnText || "🔄 FOTO LAGI / SESI BARU";

    const btnRemoveOverlay = document.getElementById('btnRemoveHomeOverlay');
    if(btnRemoveOverlay){
      btnRemoveOverlay.style.display = config.homeOverlayData ? 'block' : 'none';
    }

    const chkChroma = document.getElementById('inpChromaKeyToggle');
    const chromaWrap = document.getElementById('chromaSettingsWrap');
    if(chkChroma && chromaWrap){
      chkChroma.checked = !!config.homeOverlayChromaKey;
      chromaWrap.style.display = chkChroma.checked ? 'block' : 'none';
    }

    const inpChromaColor = document.getElementById('inpChromaColor');
    if(inpChromaColor) inpChromaColor.value = config.homeOverlayChromaColor || "#00ff00";

    const inpChromaTol = document.getElementById('inpChromaTolerance');
    const valChromaTol = document.getElementById('valChromaTolerance');
    if(inpChromaTol && valChromaTol){
      const tolVal = config.homeOverlayChromaTolerance !== undefined ? config.homeOverlayChromaTolerance : 40;
      inpChromaTol.value = tolVal;
      valChromaTol.textContent = tolVal;
    }

    const inpChromaSmooth = document.getElementById('inpChromaSmooth');
    const valChromaSmooth = document.getElementById('valChromaSmooth');
    if(inpChromaSmooth && valChromaSmooth){
      const smoothVal = config.homeOverlayChromaSmoothness !== undefined ? config.homeOverlayChromaSmoothness : 10;
      inpChromaSmooth.value = smoothVal;
      valChromaSmooth.textContent = smoothVal;
    }

    renderFrameChips();
  }

  function renderFrameChips(){
    const list = document.getElementById('frameChipList');
    list.innerHTML = '';
    config.frames.forEach((f, i) => {
      const chip = document.createElement('div');
      chip.className = 'frame-chip';
      const isVid = f.type === 'video';
      chip.innerHTML = `
        ${isVid ? `<video src="${f.dataUrl}" muted></video>` : `<img src="${f.dataUrl}" alt="${f.name || 'frame'}">`}
        <span class="chip-type-tag">${(f.type || 'PNG').toUpperCase()}</span>
        <button data-idx="${i}" title="Hapus">✕</button>
      `;
      chip.querySelector('button').onclick = () => {
        config.frames.splice(i, 1);
        renderFrameChips();
      };
      list.appendChild(chip);
    });
  }

  return {
    init,
    getConfig,
    showLoader,
    restartSession
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.AppController.init();
});
