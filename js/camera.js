/**
 * Photobooth Pro - Camera System & Filter Engine
 * Supports continuous live home background mirror & full-bleed capture preview
 */
window.CameraManager = (function(){
  let mediaStream = null;
  let activeVideoEl = null;
  let filterAnimFrame = null;
  let lastFilterThumbUpdate = 0;
  let activeFilter = 'none';

  const filterConfigs = {
    none: { css: 'none', label: 'ORIGINAL' },
    darkroom: { css: 'contrast(135%) brightness(85%) saturate(115%)', label: 'DARK ROOM' },
    retro: { css: 'sepia(45%) saturate(140%) contrast(110%) brightness(102%)', label: 'RETRO' },
    film: { css: 'sepia(25%) contrast(115%) brightness(105%) saturate(85%)', label: 'FILM' },
    flash: { css: 'brightness(120%) contrast(130%) saturate(110%)', label: 'FLASH' },
    noir: { css: 'grayscale(100%) contrast(130%) brightness(95%)', label: 'NOIR' }
  };

  /**
   * Start Camera or switch active video element seamlessly
   */
  async function start(videoEl, onStatusChange){
    activeVideoEl = videoEl;

    // If stream is already running, seamlessly attach and play without re-requesting
    if(mediaStream && mediaStream.active){
      try{
        videoEl.srcObject = mediaStream;
        await videoEl.play();
        if(onStatusChange) onStatusChange('Kamera siap', 'ready');
        startLiveFilterThumbnails();
        return true;
      }catch(e){
        // fallback to fresh start
      }
    }

    stop();
    activeVideoEl = videoEl;

    if(onStatusChange) onStatusChange('Mengaktifkan kamera...', 'loading');

    const constraintLadder = [
      {
        video: {
          facingMode: "user",
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1440, min: 720 },
          aspectRatio: { ideal: 1.333333 }
        },
        audio: false
      },
      {
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      {
        video: { facingMode: "user" },
        audio: false
      }
    ];

    let stream = null;
    let lastError = null;

    for(const constraints of constraintLadder){
      try{
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if(stream) break;
      }catch(e){
        lastError = e;
      }
    }

    if(!stream){
      const isPermissionDenied = lastError && (lastError.name === 'NotAllowedError' || lastError.name === 'PermissionDeniedError');
      const msg = isPermissionDenied ? "Izin kamera ditolak. Silakan izinkan akses kamera di browser." : "Kamera tidak ditemukan atau sedang digunakan aplikasi lain.";
      if(onStatusChange) onStatusChange(msg, 'error');
      return false;
    }

    mediaStream = stream;
    videoEl.srcObject = mediaStream;
    
    try{
      await videoEl.play();
      if(onStatusChange) onStatusChange('Kamera siap', 'ready');
      startLiveFilterThumbnails();
      return true;
    }catch(err){
      if(onStatusChange) onStatusChange('Gagal memutar stream kamera', 'error');
      return false;
    }
  }

  function isStreamActive(){
    return !!(mediaStream && mediaStream.active);
  }

  function stop(){
    stopLiveFilterThumbnails();
    if(mediaStream){
      mediaStream.getTracks().forEach(track => track.stop());
      mediaStream = null;
    }
    if(activeVideoEl){
      activeVideoEl.srcObject = null;
      activeVideoEl = null;
    }
  }

  function setFilter(filterKey){
    activeFilter = filterKey;
    if(activeVideoEl){
      const cfg = filterConfigs[filterKey] || filterConfigs.none;
      activeVideoEl.style.filter = cfg.css;
    }
  }

  function getActiveFilter(){
    return activeFilter;
  }

  function startLiveFilterThumbnails(){
    stopLiveFilterThumbnails();

    const canvases = {};
    for(const key in filterConfigs){
      const el = document.getElementById(`thumbCanvas_${key}`);
      if(el) canvases[key] = el;
    }

    function renderLoop(time){
      if(activeVideoEl && activeVideoEl.readyState >= 2){
        if(time - lastFilterThumbUpdate > 85){
          lastFilterThumbUpdate = time;
          for(const key in canvases){
            const cvs = canvases[key];
            const ctx = cvs.getContext('2d');
            ctx.save();
            ctx.translate(cvs.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(activeVideoEl, 0, 0, cvs.width, cvs.height);
            ctx.restore();
          }
        }
      }
      filterAnimFrame = requestAnimationFrame(renderLoop);
    }

    filterAnimFrame = requestAnimationFrame(renderLoop);
  }

  function stopLiveFilterThumbnails(){
    if(filterAnimFrame){
      cancelAnimationFrame(filterAnimFrame);
      filterAnimFrame = null;
    }
  }

  /**
   * Capture high-res horizontal snapshot (1200x900)
   */
  function takeSnapshot(workCanvas){
    if(!activeVideoEl || activeVideoEl.readyState < 2) return null;

    const W = 1200;
    const H = 900;
    workCanvas.width = W;
    workCanvas.height = H;
    const ctx = workCanvas.getContext('2d');

    ctx.save();
    ctx.translate(W, 0);
    ctx.scale(-1, 1);

    const cfg = filterConfigs[activeFilter] || filterConfigs.none;
    ctx.filter = cfg.css;

    ctx.drawImage(activeVideoEl, 0, 0, W, H);
    ctx.restore();

    return workCanvas.toDataURL('image/jpeg', 0.92);
  }

  return {
    start,
    stop,
    isStreamActive,
    setFilter,
    getActiveFilter,
    takeSnapshot,
    filterConfigs
  };
})();
