/**
 * Photobooth Pro - Camera & Live Motion Capture Engine
 * Fitur: Mengakses kamera, countdown timer, perekaman live video motion, jepret foto HD, switch facing mode, dan retake pose.
 */

// Global State
let jepretanKe = 0;
let totalFoto = 4;
let waktuTimer = 3;

let frameUntukGif = [];      // Array of still image Base64 data URLs
let liveVideos = [];         // Array of recorded video blob URLs for each shot
let liveVideoBlobs = [];     // Array of raw Blob objects for ZIP export
let streamActive = null;
let currentFacingMode = 'user';
let retakeIndex = -1;
let activeSelectedPhotoIdx = null;
let currentFilter = 'none';
let currentSelectedFrame = null;

// ================= CAMERA STREAM CONTROLLER =================
async function initCameraStream(facingMode = currentFacingMode, forceNew = false) {
    const video = document.getElementById('kamera');
    const cameraContainer = document.getElementById('cameraContainer');
    
    if (cameraContainer) cameraContainer.style.display = 'block';
    if (!video) return null;

    // Reuse existing stream if already active and running (1x izin saja)
    if (!forceNew && streamActive && streamActive.active) {
        const videoTracks = streamActive.getVideoTracks();
        if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
            videoTracks.forEach(track => track.enabled = true);
            if (video.srcObject !== streamActive) {
                video.srcObject = streamActive;
            }
            try {
                await video.play();
            } catch (e) {}
            hideCameraError();
            return streamActive;
        }
    }

    currentFacingMode = facingMode;

    // Progressive fallbacks for robust camera compatibility across all devices
    const constraintsList = [
        { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: facingMode }, audio: false },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false }
    ];

    let lastError = null;

    // Stop existing tracks only if switching camera or stream is dead
    if (streamActive) {
        try {
            streamActive.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.warn("Error stopping old tracks:", e);
        }
        streamActive = null;
    }

    for (const constraint of constraintsList) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraint);
            streamActive = stream;
            video.srcObject = stream;
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
            video.muted = true;
            
            // Adjust mirror CSS transform based on facing mode
            if (currentFacingMode === 'user') {
                video.style.transform = 'scaleX(-1)';
            } else {
                video.style.transform = 'scaleX(1)';
            }

            try {
                await video.play();
            } catch (playErr) {
                console.log("Video auto-play pending or muted:", playErr);
            }

            hideCameraError();
            console.log("Kamera berhasil diaktifkan (disimpan untuk sesi selanjutnya):", constraint);
            return stream;
        } catch (err) {
            lastError = err;
            console.warn("Mencoba constraint kamera berikutnya karena:", err.name || err.message);
        }
    }

    console.error("Gagal mengaktifkan kamera pada semua constraint:", lastError);
    showCameraError(lastError);
    return null;
}

async function toggleCameraFacing() {
    const newFacing = currentFacingMode === 'user' ? 'environment' : 'user';
    return await initCameraStream(newFacing, true); // forceNew = true saat user sengaja membalik kamera
}

function showCameraError(err) {
    const errorOverlay = document.getElementById('cameraErrorOverlay');
    const errorMsg = document.getElementById('cameraErrorMessage');
    if (errorOverlay) {
        errorOverlay.classList.remove('hide');
        if (errorMsg && err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMsg.innerText = "Izin akses kamera ditolak oleh browser. Silakan klik ikon gembok/kamera pada address bar browser Anda untuk mengizinkan kamera, lalu klik Coba Lagi.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMsg.innerText = "Tidak ditemukan kamera atau webcam pada perangkat Anda.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMsg.innerText = "Kamera sedang digunakan oleh aplikasi lain (seperti Zoom, Teams, atau Google Meet). Silakan tutup aplikasi tersebut lalu klik Coba Lagi.";
            } else {
                errorMsg.innerText = `Gagal membuka kamera (${err.name || 'Error'}): ${err.message || 'Periksa izin kamera browser Anda.'}`;
            }
        }
    }
}

function hideCameraError() {
    const errorOverlay = document.getElementById('cameraErrorOverlay');
    if (errorOverlay) errorOverlay.classList.add('hide');
}

function activateCameraView() {
    const cameraContainer = document.getElementById('cameraContainer');
    const customBgColorLayer = document.getElementById('customBgColorLayer');
    const customBgImageLayer = document.getElementById('customBgImageLayer');
    const globalBgOverlay = document.getElementById('globalBgOverlay');

    if (cameraContainer) cameraContainer.style.display = 'block';
    if (customBgColorLayer) customBgColorLayer.style.opacity = '0';
    if (customBgImageLayer) customBgImageLayer.style.opacity = '0';
    if (globalBgOverlay) globalBgOverlay.style.opacity = '0';

    initCameraStream();
}

function deactivateCameraView() {
    if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.applyConfig === 'function') {
        ThemeManager.applyConfig(ThemeManager.getConfig());
    }
}

// ================= DRAW IMAGE WITH TRUE COVER FIT (NO STRETCH) =================
function drawImageCover(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
    if (!ctx || !img) return;
    const nw = img.naturalWidth || img.videoWidth || img.width || w;
    const nh = img.naturalHeight || img.videoHeight || img.height || h;
    if (!nw || !nh || nw <= 0 || nh <= 0) return;

    let sx = 0, sy = 0, sWidth = nw, sHeight = nh;
    const rSource = nw / nh;
    const rDest = w / h;

    if (rSource > rDest) {
        sWidth = nh * rDest;
        sx = (nw - sWidth) * offsetX;
    } else {
        sHeight = nw / rDest;
        sy = (nh - sHeight) * offsetY;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}

// ================= LIVE VIDEO RECORDER =================
const liveRecCanvas = document.createElement('canvas');
liveRecCanvas.width = 640;
liveRecCanvas.height = 480;
const liveRecCtx = liveRecCanvas.getContext('2d');
let liveRecorder = null;
let liveChunks = [];
let liveAnimId = null;

function startLiveRecording() {
    const video = document.getElementById('kamera');
    liveChunks = [];
    const stream = liveRecCanvas.captureStream(30);
    let options = { mimeType: 'video/webm;codecs=vp8' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm')) options = { mimeType: 'video/webm' };
        else if (MediaRecorder.isTypeSupported('video/mp4')) options = { mimeType: 'video/mp4' };
        else options = {};
    }
    
    try {
        liveRecorder = new MediaRecorder(stream, options);
    } catch(e) {
        liveRecorder = new MediaRecorder(stream);
    }
    
    liveRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) liveChunks.push(e.data);
    };

    function drawLiveFrame() {
        if (video && video.videoWidth > 0 && video.videoHeight > 0) {
            liveRecCtx.save();
            if (currentFacingMode === 'user') {
                liveRecCtx.translate(liveRecCanvas.width, 0);
                liveRecCtx.scale(-1, 1);
            }
            drawImageCover(liveRecCtx, video, 0, 0, liveRecCanvas.width, liveRecCanvas.height);
            liveRecCtx.restore();
        }
        if (liveRecorder && liveRecorder.state === 'recording') {
            liveAnimId = requestAnimationFrame(drawLiveFrame);
        }
    }
    
    liveRecorder.start(100);
    drawLiveFrame();
}

function stopLiveRecording() {
    return new Promise((resolve) => {
        if (!liveRecorder || liveRecorder.state !== 'recording') {
            resolve(null);
            return;
        }
        if (liveAnimId) cancelAnimationFrame(liveAnimId);
        liveRecorder.onstop = () => {
            const blob = new Blob(liveChunks, { type: liveRecorder.mimeType || 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            resolve({ blob, videoUrl });
        };
        liveRecorder.stop();
    });
}

// ================= SHUTTER FLASH & COUNTERS =================
function flashEffect() { 
    const flashOverlay = document.getElementById('flashOverlay');
    if (flashOverlay) {
        flashOverlay.classList.add('flash-active'); 
        setTimeout(() => { flashOverlay.classList.remove('flash-active'); }, 70); 
    }
}

function updateCounterText() { 
    const textCounter = document.getElementById('textCounter');
    if (textCounter) textCounter.innerText = `${jepretanKe}/${totalFoto}`; 
}

// ================= CAPTURE PHOTO & LIVE VIDEO =================
async function tangkapFotoDanLiveVideo() {
    const video = document.getElementById('kamera');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const btnContinue = document.getElementById('btnContinue');

    // 1. Capture Still Photo Canvas with True Aspect Ratio (Mirrored if facing user)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = lebarFoto; 
    tempCanvas.height = tinggiFoto;
    const tCtx = tempCanvas.getContext('2d');
    
    if (currentFacingMode === 'user') {
        tCtx.translate(lebarFoto, 0); 
        tCtx.scale(-1, 1);
    }
    drawImageCover(tCtx, video, 0, 0, lebarFoto, tinggiFoto);
    
    const photoDataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);

    // 2. Stop Live Video Recorder & Get Video Blob & URL
    const liveResult = await stopLiveRecording();
    const liveVideoUrl = liveResult ? liveResult.videoUrl : null;
    const liveVideoBlob = liveResult ? liveResult.blob : null;

    // 3. Save to Collections
    if (retakeIndex !== -1) {
        frameUntukGif[retakeIndex] = photoDataUrl; 
        liveVideos[retakeIndex] = liveVideoUrl;
        liveVideoBlobs[retakeIndex] = liveVideoBlob;
        
        const imgThumb = document.getElementById(`thumb-img-${retakeIndex}`);
        if (imgThumb) imgThumb.src = photoDataUrl; 
        
        retakeIndex = -1; 
        if (btnContinue) btnContinue.classList.remove('hide'); 
    } else {
        const currentIndex = jepretanKe;
        frameUntukGif.push(photoDataUrl); 
        liveVideos.push(liveVideoUrl);
        liveVideoBlobs.push(liveVideoBlob);

        // Render Thumbnail
        const wrapper = document.createElement('div'); 
        wrapper.className = 'relative group bg-white rounded-xl overflow-hidden border border-slate-200 shadow-md';
        
        const imgThumb = document.createElement('img');
        imgThumb.src = photoDataUrl; 
        imgThumb.id = `thumb-img-${currentIndex}`;
        imgThumb.className = 'user-photo w-[86px] h-[64px] object-cover';
        imgThumb.style.filter = filters[currentFilter].css; 

        const liveBadge = document.createElement('div');
        liveBadge.className = 'absolute bottom-1 left-1 bg-black/80 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow pointer-events-none';
        liveBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-red-500 live-dot"></span> LIVE';

        const btnRetake = document.createElement('button');
        btnRetake.className = 'retake-btn absolute top-1 right-1 text-white bg-black/75 hover:bg-black w-6 h-6 rounded flex items-center justify-center backdrop-blur-sm transition z-10 opacity-80 hover:opacity-100 shadow border border-gray-600';
        btnRetake.title = "Ambil Ulang Pose Ini";
        btnRetake.innerHTML = '<i class="ph ph-arrow-counter-clockwise font-bold text-xs"></i>';
        btnRetake.onclick = () => mulaiRetake(currentIndex);

        wrapper.appendChild(imgThumb); 
        wrapper.appendChild(liveBadge);
        wrapper.appendChild(btnRetake); 
        if (thumbnailContainer) thumbnailContainer.appendChild(wrapper);

        jepretanKe++; 
        updateCounterText();
    }
}

// ================= COUNTDOWN LOGIC =================
function mulaiCountdown() {
    const countdownOverlay = document.getElementById('countdownOverlay');
    const liveRecBadge = document.getElementById('liveRecBadge');
    const teksCountdown = document.getElementById('teksCountdown');
    const btnContinue = document.getElementById('btnContinue');
    const thumbnailContainer = document.getElementById('thumbnailContainer');

    if (jepretanKe >= totalFoto) {
        if (countdownOverlay) countdownOverlay.classList.add('hide'); 
        if (liveRecBadge) liveRecBadge.classList.add('hide');
        if (btnContinue) btnContinue.classList.remove('hide'); 
        if (thumbnailContainer) thumbnailContainer.classList.remove('capturing'); 
        updateCounterText(); 
        return;
    }

    if (countdownOverlay) countdownOverlay.classList.remove('hide');
    if (liveRecBadge) liveRecBadge.classList.remove('hide');

    startLiveRecording();

    let waktu = waktuTimer; 
    if (teksCountdown) teksCountdown.innerText = waktu;
    playBeep(520, 0.08);

    const interval = setInterval(async () => {
        waktu--;
        if (waktu > 0) { 
            if (teksCountdown) teksCountdown.innerText = waktu; 
            playBeep(520, 0.08);
        } else {
            clearInterval(interval); 
            if (countdownOverlay) countdownOverlay.classList.add('hide');
            if (liveRecBadge) liveRecBadge.classList.add('hide');

            flashEffect();
            playShutterSound();

            await tangkapFotoDanLiveVideo();

            if (jepretanKe < totalFoto) { 
                setTimeout(mulaiCountdown, 1200); 
            } else { 
                mulaiCountdown(); 
            }
        }
    }, 1000);
}

// ================= RETAKE SINGLE SHOT =================
function mulaiRetake(index) {
    if (retakeIndex !== -1) return; 
    retakeIndex = index; 

    const btnContinue = document.getElementById('btnContinue');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const countdownOverlay = document.getElementById('countdownOverlay');
    const liveRecBadge = document.getElementById('liveRecBadge');
    const teksCountdown = document.getElementById('teksCountdown');

    if (btnContinue) btnContinue.classList.add('hide'); 
    if (thumbnailContainer) thumbnailContainer.classList.add('capturing'); 
    if (countdownOverlay) countdownOverlay.classList.remove('hide');
    if (liveRecBadge) liveRecBadge.classList.remove('hide');

    startLiveRecording();

    let waktu = waktuTimer; 
    if (teksCountdown) teksCountdown.innerText = waktu;
    playBeep(520, 0.08);

    const interval = setInterval(async () => {
        waktu--;
        if (waktu > 0) { 
            if (teksCountdown) teksCountdown.innerText = waktu; 
            playBeep(520, 0.08);
        } else {
            clearInterval(interval); 
            if (countdownOverlay) countdownOverlay.classList.add('hide');
            if (liveRecBadge) liveRecBadge.classList.add('hide');

            flashEffect();
            playShutterSound();

            await tangkapFotoDanLiveVideo();

            if (thumbnailContainer) thumbnailContainer.classList.remove('capturing');
        }
    }, 1000);
}
