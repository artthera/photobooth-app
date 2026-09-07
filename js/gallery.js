/**
 * Photobooth Pro - Gallery & Complete Download Engine
 * Modern Premium Event Success Page & Cloud Gallery Viewer
 * Features:
 * - Fixed/Sticky full-viewport Background that stays seamless while scrolling to the bottom
 * - Sticky Photo Strip Preview that stays pinned on screen while scrolling
 */
window.GalleryManager = (function(){
  "use strict";

  function renderCompleteDashboard(containerEl, sessionData, isCloudMode = false, customConfig = null){
    if(!containerEl || !sessionData) return;

    const cfg = customConfig || window.AppController?.getConfig?.() || window.PhotoboothConfig.defaults;
    const totalGenerated = sessionData.photoNumber || getIncrementedPhotoCount();
    const photos = sessionData.individualPhotos || [];
    const sessionId = sessionData.sessionId || 'pb_session';

    const baseUrl = window.location.origin + window.location.pathname;
    const sessionUrl = `${baseUrl}?sessionId=${sessionId}`;

    const bannerTitle = cfg.doneBannerTitle || "✨ FOTO KAMU SUDAH SIAP! ✨";
    const bannerSub = cfg.doneBannerSub || "Scan QR di bawah untuk mengambil semua momen terbaikmu.";
    const bannerBg = cfg.doneBannerBg || "#ffea00";
    const bannerText = cfg.doneBannerText || "#000000";
    
    const cardBg = cfg.doneCardBg || "#ffffff";
    const cardBorder = cfg.doneCardBorder || "#111827";
    const scanTitle = cfg.doneScanTitle || "SCAN UNTUK DOWNLOAD!";
    const scanTitleColor = cfg.doneScanTitleColor || "#ff2a4b";

    const btnStripBg = cfg.doneBtnStripBg || "#ff2a4b";
    const btnStripText = cfg.doneBtnStripText || "#ffffff";
    const btnGifBg = cfg.doneBtnGifBg || "#ffea00";
    const btnGifText = cfg.doneBtnGifText || "#000000";
    const restartText = cfg.doneRestartBtnText || "🔄 FOTO LAGI / SESI BARU";

    // Setup result screen background (Video / GIF / Image / Color) that STAYS fixed when scrolling
    const bgVideo = containerEl.querySelector('.screen-bg-media[id$="BgVideo"]');
    const bgImage = containerEl.querySelector('.screen-bg-media[id$="BgImage"]');
    const bgOverlay = containerEl.querySelector('.screen-bg-overlay');
    const bgMode = cfg.doneBgMode || 'color';

    if(bgVideo && bgImage && bgOverlay){
      const fit = cfg.doneBgFit || 'cover';
      bgVideo.style.objectFit = fit;
      bgImage.style.objectFit = fit;

      if(bgMode === 'video' && cfg.doneBgData){
        if(bgVideo.src !== cfg.doneBgData) bgVideo.src = cfg.doneBgData;
        bgVideo.style.display = 'block';
        bgVideo.play().catch(()=>{});
        bgImage.style.display = 'none';
        bgOverlay.style.display = 'block';
        containerEl.style.backgroundColor = 'transparent';
      } else if((bgMode === 'image' || bgMode === 'gif') && cfg.doneBgData){
        bgImage.src = cfg.doneBgData;
        bgImage.style.display = 'block';
        bgVideo.style.display = 'none';
        bgOverlay.style.display = 'block';
        containerEl.style.backgroundColor = 'transparent';
      } else {
        bgVideo.style.display = 'none';
        bgImage.style.display = 'none';
        bgOverlay.style.display = 'none';
        containerEl.style.backgroundColor = cfg.doneBgColor || '#f1f3f7';
      }

      const opVal = (cfg.doneBgOpacity !== undefined ? cfg.doneBgOpacity : 35) / 100;
      bgOverlay.style.opacity = opVal;
    }

    const mountEl = containerEl.querySelector('.done-content-mount, .gallery-content-mount') || containerEl;

    mountEl.innerHTML = `
      <div class="result-dashboard-wrapper">
        
        <!-- 1. Top Success Hero Banner -->
        <div class="top-yellow-banner" style="background:${bannerBg}; color:${bannerText}; border-color:${cardBorder};">
          <div class="banner-sparkle-pill">🎉 SUCCESS EVENT PHOTOBOOTH</div>
          <h1 class="banner-title">${bannerTitle}</h1>
          <p class="banner-subtitle" style="color:${bannerText};">${bannerSub}</p>
          <div class="banner-badge-box">
            <span class="banner-badge">📸 Sesi #${sessionId.substring(0,8).toUpperCase()} • Foto ke-#${totalGenerated}</span>
          </div>
        </div>

        <!-- 2. Main 2-Column Split: Sticky Left (Photo Strip PNG) + Scrollable Right (QR, GIF, Raw Shots) -->
        <div class="dashboard-split-layout">
          
          <!-- LEFT COLUMN: Sticky Photo Strip PNG Card (Stays in view during scroll) -->
          <div class="dashboard-sticky-col">
            <div class="preview-card sticky-strip-card" style="background:${cardBg}; border-color:${cardBorder};">
              <div class="card-header">
                <span class="card-title">🖼️ PHOTO STRIP (FRAME PNG)</span>
                <span class="mini-badge">HIGH RES</span>
              </div>
              <div class="card-image-wrap strip-wrap">
                <img id="resStripImg" src="${sessionData.fullStripUrl || ''}" alt="Photo Strip Full">
              </div>
              <button class="btn-action red" id="btnDownloadStrip" style="background:${btnStripBg}; color:${btnStripText}; border-color:${cardBorder};">
                📥 DOWNLOAD STRIP PNG
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN: QR Spotlight, Animated Living GIF, 3 Raw Photos & Controls -->
          <div class="dashboard-main-col">
            
            <!-- A. Hero QR Code Card (Central Spotlight) -->
            <div class="scan-qr-card" style="background:${cardBg}; border-color:${cardBorder};">
              <div class="scan-qr-left">
                <div class="badge-row">
                  <span class="badge-pill green">⚡ INSTANT CLOUD DOWNLOAD</span>
                  <span class="badge-pill yellow">📱 MOBILE READY</span>
                </div>
                <h2 class="scan-title" style="color:${scanTitleColor};">${scanTitle}</h2>
                <p class="scan-desc">Buka kamera di HP kamu lalu arahkan ke QR Code di samping. Semua foto dan animasi strip langsung terbuka dan siap disimpan!</p>
                <ul class="scan-bullets">
                  <li>✅ <b>1 Photo Strip (High-Res PNG)</b> berbingkai desain</li>
                  <li>✅ <b>1 Animated GIF (Loop)</b> strip animasi bergerak</li>
                  <li>✅ <b>3 Foto Mentahan (Raw Shots)</b> resolusi penuh</li>
                </ul>
              </div>
              <div class="scan-qr-right">
                <div class="qr-canvas-box" id="dashboardQrCodeCanvas" style="border-color:${cardBorder};"></div>
                <span class="qr-label-footer">ARAHKAN KAMERA HP DISINI</span>
              </div>
            </div>

            <!-- B. Animated Living GIF Preview Card -->
            <div class="preview-card" style="background:${cardBg}; border-color:${cardBorder};">
              <div class="card-header">
                <span class="card-title">🎞️ ANIMATED LIVING GIF (LOOP)</span>
                <span class="mini-badge">ANIMASI BERGERAK</span>
              </div>
              <div class="card-image-wrap gif-wrap">
                <img id="resGifImg" src="${sessionData.liveVideoUrl || photos[0] || ''}" alt="Animated GIF Loop">
              </div>
              <button class="btn-action yellow" id="btnDownloadGif" style="background:${btnGifBg}; color:${btnGifText}; border-color:${cardBorder};">
                🎞️ DOWNLOAD ANIMATED GIF
              </button>
            </div>

            <!-- C. 3 Raw Photos Grid (Individual & Batch ZIP) -->
            <div class="raw-shots-card" style="background:${cardBg}; border-color:${cardBorder};">
              <div class="raw-header">
                <div>
                  <span class="raw-title">📷 3 FOTO MENTAHAN (RAW SHOTS)</span>
                  <span class="raw-sub">Resolusi asli tanpa frame &amp; bebas watermark</span>
                </div>
                <button class="btn-small yellow" id="btnDownloadAllZip" style="border-color:${cardBorder};">
                  📦 DOWNLOAD SEMUA FILE (ZIP)
                </button>
              </div>

              <div class="raw-grid">
                ${photos.map((photoUrl, idx) => `
                  <div class="raw-item">
                    <div class="raw-img-box" style="border-color:${cardBorder};">
                      <img src="${photoUrl}" alt="Shot ${idx+1}">
                    </div>
                    <div class="raw-info">
                      <span>Foto ${idx+1}</span>
                      <span class="tag">HD JPG</span>
                    </div>
                    <button class="btn-action small yellow" data-shot-idx="${idx}" style="border-color:${cardBorder};">
                      📥 Download #${idx+1}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- D. Bottom Action Bar -->
            <div class="bottom-action-bar">
              <button class="btn-bar white" id="btnCopySessionLink" style="border-color:${cardBorder};">
                🔗 SALIN LINK DOWNLOAD
              </button>
              <button class="btn-bar yellow" id="btnRestartAfterDone" style="border-color:${cardBorder};">
                ${restartText}
              </button>
            </div>

          </div>

        </div>

      </div>
    `;

    // Render Dynamic QR Code
    const qrTarget = document.getElementById('dashboardQrCodeCanvas');
    if(qrTarget && typeof QRCode !== 'undefined'){
      qrTarget.innerHTML = '';
      new QRCode(qrTarget, {
        text: sessionUrl,
        width: 176,
        height: 176,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.M
      });
    }

    bindDashboardActions(sessionData, sessionUrl);
  }

  function bindDashboardActions(sessionData, sessionUrl){
    const sId = (sessionData.sessionId || 'session').substring(0, 8);

    // 1. Download Strip PNG
    const btnStrip = document.getElementById('btnDownloadStrip');
    if(btnStrip && sessionData.fullStripUrl){
      btnStrip.onclick = () => {
        window.PhotoboothUtils.triggerDownload(sessionData.fullStripUrl, `photobooth_strip_${sId}.png`);
      };
    }

    // 2. Download GIF
    const btnGif = document.getElementById('btnDownloadGif');
    if(btnGif && sessionData.liveVideoUrl){
      btnGif.onclick = () => {
        window.PhotoboothUtils.triggerDownload(sessionData.liveVideoUrl, `photobooth_animated_${sId}.gif`);
      };
    }

    // 3. Download Individual Photos
    document.querySelectorAll('button[data-shot-idx]').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.shotIdx, 10);
        const url = sessionData.individualPhotos?.[idx];
        if(url){
          window.PhotoboothUtils.triggerDownload(url, `photobooth_shot_${sId}_${idx+1}.jpg`);
        }
      };
    });

    // 4. Download All Zip (JSZip)
    const btnZip = document.getElementById('btnDownloadAllZip');
    if(btnZip){
      btnZip.onclick = async () => {
        if(typeof JSZip === 'undefined'){
          alert('Library JSZip belum siap. Silakan unduh foto satu per satu.');
          return;
        }

        btnZip.textContent = '⏳ Mengompres ZIP...';
        btnZip.disabled = true;

        try{
          const zip = new JSZip();
          const folder = zip.folder(`photobooth_${sId}`);

          if(sessionData.fullStripUrl){
            const blob = await fetch(sessionData.fullStripUrl).then(r=>r.blob());
            folder.file(`photo_strip_${sId}.png`, blob);
          }

          if(sessionData.liveVideoUrl){
            const blob = await fetch(sessionData.liveVideoUrl).then(r=>r.blob());
            folder.file(`animated_strip_${sId}.gif`, blob);
          }

          if(sessionData.individualPhotos && sessionData.individualPhotos.length){
            for(let i=0; i<sessionData.individualPhotos.length; i++){
              const blob = await fetch(sessionData.individualPhotos[i]).then(r=>r.blob());
              folder.file(`raw_shot_${i+1}.jpg`, blob);
            }
          }

          const content = await zip.generateAsync({ type: 'blob' });
          const zipUrl = URL.createObjectURL(content);
          window.PhotoboothUtils.triggerDownload(zipUrl, `photobooth_complete_${sId}.zip`);
          setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
        }catch(err){
          console.error('[ZIP Error]', err);
          alert('Gagal membuat file ZIP.');
        }finally{
          btnZip.textContent = '📦 DOWNLOAD SEMUA FILE (ZIP)';
          btnZip.disabled = false;
        }
      };
    }

    // 5. Copy Link
    const btnCopy = document.getElementById('btnCopySessionLink');
    if(btnCopy){
      btnCopy.onclick = async () => {
        try{
          await navigator.clipboard.writeText(sessionUrl);
          const orig = btnCopy.textContent;
          btnCopy.textContent = '✅ LINK BERHASIL DISALIN!';
          setTimeout(() => btnCopy.textContent = orig, 2500);
        }catch(e){
          alert('Link sesi: ' + sessionUrl);
        }
      };
    }

    // 6. Restart Session
    const btnRestart = document.getElementById('btnRestartAfterDone');
    if(btnRestart){
      btnRestart.onclick = () => {
        if(window.AppController && window.AppController.restartSession){
          window.AppController.restartSession();
        } else {
          window.location.href = window.location.pathname;
        }
      };
    }
  }

  async function loadSessionGallery(sessionId, storageClient){
    const container = document.getElementById('screen-gallery');
    if(!container) return;

    const mountEl = container.querySelector('.gallery-content-mount') || container;

    mountEl.innerHTML = `
      <div class="result-dashboard-wrapper" style="padding-top:40px; text-align:center;">
        <div class="spinner" style="margin:20px auto;"></div>
        <h2 style="font-weight:800; font-size:1.3rem;">Mengambil Galeri Foto...</h2>
        <p style="color:#6b7280; font-size:.88rem;">Sesi #${sessionId.substring(0,8).toUpperCase()}</p>
      </div>
    `;

    try{
      const sessionData = await storageClient.getSession(sessionId);
      if(!sessionData){
        mountEl.innerHTML = `
          <div class="result-dashboard-wrapper" style="padding-top:50px; text-align:center;">
            <div style="font-size:3rem; margin-bottom:10px;">⚠️</div>
            <h2 style="font-weight:800; font-size:1.4rem;">Sesi Foto Tidak Ditemukan</h2>
            <p style="color:#6b7280; font-size:.9rem; max-width:450px; margin:0 auto 20px;">
              Sesi foto ini mungkin sudah kedaluwarsa atau URL tidak valid.
            </p>
            <a href="${window.location.pathname}" class="primary-btn" style="display:inline-flex; text-decoration:none;">
              Kembali ke Photobooth
            </a>
          </div>
        `;
        return;
      }

      renderCompleteDashboard(container, sessionData, true);

    }catch(err){
      console.error('[Gallery Load Error]', err);
      mountEl.innerHTML = `
        <div class="result-dashboard-wrapper" style="padding-top:50px; text-align:center;">
          <div style="font-size:3rem; margin-bottom:10px;">❌</div>
          <h2 style="font-weight:800; font-size:1.4rem;">Gagal Memuat Galeri</h2>
          <p style="color:#ef476f; font-size:.9rem;">Terjadi kesalahan jaringan atau koneksi storage.</p>
        </div>
      `;
    }
  }

  function getIncrementedPhotoCount(){
    try{
      const key = window.PhotoboothConfig.TOTAL_COUNT_KEY;
      const count = parseInt(localStorage.getItem(key) || '100', 10) + 1;
      localStorage.setItem(key, count);
      return count;
    }catch(e){
      return 101;
    }
  }

  return {
    renderCompleteDashboard,
    loadSessionGallery
  };
})();
