/**
 * Photobooth Pro - Export Engine & Cloud Storage
 * Fitur: Rasterisasi Photo Strip Ultra-HD, Live Video Motion MP4, Looping GIF, All-in-One ZIP, dan Google Drive Cloud Uploader.
 */

let finalAnimFrames = [];
let animIntervalId = null;
let currentAnimFrameIndex = 0;
let finalStripImageUrl = null;
let finalStripPngUrl = null;
let finalStripBlob = null;

// ================= TRUE COVER FIT HELPER (ZERO DISTORTION / NO STRETCH) =================
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

function renderCroppedPhotoForSlot(src, targetW, targetH, filterStr = 'none') {
    return new Promise((resolve) => {
        if (!src) return resolve('');
        const img = new Image();
        img.onload = () => {
            const scale = 2.5; // Ultra-HD print quality scale
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(10, Math.round(targetW * scale));
            canvas.height = Math.max(10, Math.round(targetH * scale));
            const ctx = canvas.getContext('2d');
            
            if (filterStr && filterStr !== 'none') {
                ctx.filter = filterStr;
            }

            drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.96));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
}

// ================= RENDER LIVE VIDEO FRAME PREVIEW =================
function setupLiveVideoFramePreview() {
    const liveContainer = document.getElementById('liveVideoFrameContainer');
    if (!currentSelectedFrame || !liveContainer) return;

    liveContainer.style.width = currentSelectedFrame.width + 'px';
    liveContainer.style.height = currentSelectedFrame.height + 'px';
    liveContainer.innerHTML = currentSelectedFrame.html;

    const editorSlots = document.querySelectorAll('#frameEditor .drop-slot');
    const liveSlots = liveContainer.querySelectorAll('.drop-slot');

    liveSlots.forEach((slot, idx) => {
        const editorSlot = editorSlots[idx];
        const shotIdx = editorSlot ? parseInt(editorSlot.dataset.shotIndex ?? idx) : (idx % frameUntukGif.length);
        const videoUrl = liveVideos[shotIdx];
        const photoUrl = frameUntukGif[shotIdx];

        slot.classList.remove('border-dashed');
        slot.style.borderStyle = 'none';
        slot.style.backgroundColor = 'transparent';

        if (videoUrl) {
            slot.innerHTML = `
                <video src="${videoUrl}" autoplay loop muted playsinline class="user-video w-full h-full object-cover pointer-events-none" style="filter: ${filters[currentFilter].css}; width: 100%; height: 100%; object-fit: cover; display: block;"></video>
            `;
        } else if (photoUrl) {
            slot.innerHTML = `
                <img src="${photoUrl}" class="user-photo w-full h-full object-cover pointer-events-none" style="filter: ${filters[currentFilter].css}; width: 100%; height: 100%; object-fit: cover; display: block;" />
            `;
        }
    });

    const wrapper = document.getElementById('liveVideoFrameWrapper');
    if (wrapper) {
        const availableHeight = 420;
        const scale = Math.min(availableHeight / currentSelectedFrame.height, 270 / currentSelectedFrame.width, 0.72);
        wrapper.style.transform = `scale(${scale})`;
    }
}

// ================= PROSES HASIL & BIND DOWNLOADS =================
function prosesHasil() {
    // Output 1: Photo Strip
    const hasilStrip = document.getElementById('hasilStrip');
    if (hasilStrip) hasilStrip.src = finalStripImageUrl;
    
    const btnDownloadStrip = document.getElementById('btnDownloadStrip');
    if (btnDownloadStrip) {
        btnDownloadStrip.onclick = () => {
            const a = document.createElement('a'); 
            a.href = finalStripImageUrl; 
            a.download = `photobooth_strip_${Date.now()}.jpg`; 
            a.click();
        };
    }

    const btnDownloadStripPng = document.getElementById('btnDownloadStripPng');
    if (btnDownloadStripPng) {
        btnDownloadStripPng.onclick = () => {
            const a = document.createElement('a'); 
            a.href = finalStripPngUrl; 
            a.download = `photobooth_strip_${Date.now()}.png`; 
            a.click();
        };
    }

    // Output 2: Live Video Frame Download
    const btnDownloadLiveVideo = document.getElementById('btnDownloadLiveVideo');
    if (btnDownloadLiveVideo) btnDownloadLiveVideo.onclick = downloadLiveVideoFrameMP4;

    // Output 3: GIF Preview & Download
    startAnimPreview();
    const btnDownloadGif = document.getElementById('btnDownloadGif');
    if (btnDownloadGif) btnDownloadGif.onclick = downloadGifImage;

    // Master Action: Download All ZIP
    const btnDownloadAllZip = document.getElementById('btnDownloadAllZip');
    if (btnDownloadAllZip) btnDownloadAllZip.onclick = downloadAllMomentsZip;

    // ================= CUSTOMER SESSION & QR GENERATOR =================
    const currentSessionId = 'pb_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const cfg = typeof ThemeManager !== 'undefined' ? ThemeManager.getConfig() : {};
    const brandName = cfg.brandName || 'Eazy Fotobooth';

    // Construct customer page URL
    const basePath = window.location.href.split('?')[0].replace(/index\.html$/, '').replace(/\/$/, '');
    const customerUrl = `${basePath}/customer.html?session=${currentSessionId}`;

    // Prepare session data object
    const sessionData = {
        id: currentSessionId,
        createdAt: Date.now(),
        dateStr: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        brandName: brandName,
        stripJpg: finalStripImageUrl,
        stripPng: finalStripPngUrl,
        rawShots: Array.isArray(frameUntukGif) ? [...frameUntukGif] : [],
        liveVideos: Array.isArray(liveVideos) ? [...liveVideos] : [],
        gifUrl: null,
        gdriveUrl: null,
        totalShots: frameUntukGif ? frameUntukGif.length : 0,
        frameName: currentSelectedFrame ? currentSelectedFrame.name : 'Photo Strip'
    };

    // Save initial session to SessionDB
    if (typeof SessionDB !== 'undefined') {
        SessionDB.saveSession(sessionData);
    }

    // Generate GIF in background if frames exist, then update session
    if (typeof gifshot !== 'undefined' && finalAnimFrames && finalAnimFrames.length > 0) {
        gifshot.createGIF({
            images: finalAnimFrames,
            interval: 0.16,
            gifWidth: 360,
            gifHeight: 270,
            numFrames: 10
        }, function(obj) {
            if (!obj.error && obj.image) {
                sessionData.gifUrl = obj.image;
                if (typeof SessionDB !== 'undefined') {
                    SessionDB.saveSession(sessionData);
                }
            }
        });
    }

    // QR Code & Google Drive Auto Upload Elements
    const qrContainer = document.getElementById("qrcode");
    const qrSpinner = document.getElementById("qrLoadingSpinner");
    const gdriveBadge = document.getElementById("gdriveStatusBadge");
    const btnOpenGdrive = document.getElementById("btnOpenGdriveFolder");
    const btnSetupGdrive = document.getElementById("btnSetupGdriveResults");
    const qrDesc = document.getElementById("qrDescriptionText");
    const btnSimulate = document.getElementById("btnSimulateMobile");

    function renderQr(url) {
        if (!qrContainer) return;
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, { 
            text: url, 
            width: 120, 
            height: 120, 
            colorDark : "#0f172a", 
            colorLight : "#ffffff", 
            correctLevel : QRCode.CorrectLevel.M 
        });
    }

    // Render QR pointing directly to Customer Page
    renderQr(customerUrl);

    // Make QR container clickable for instant desktop simulation
    if (qrContainer) {
        qrContainer.style.cursor = 'pointer';
        qrContainer.title = 'Klik untuk simulasi tampilan HP pelanggan';
        qrContainer.onclick = () => {
            window.open(customerUrl, '_blank');
        };
    }

    // Setup Simulation Button
    if (btnSimulate) {
        btnSimulate.href = customerUrl;
        btnSimulate.onclick = (e) => {
            e.preventDefault();
            window.open(customerUrl, '_blank');
        };
    }

    const webhookUrl = (cfg.gdriveWebhookUrl || '').trim();
    const autoUpload = cfg.gdriveAutoUpload !== false;

    if (webhookUrl && autoUpload) {
        if (qrSpinner) qrSpinner.classList.remove('hidden');
        if (qrDesc) qrDesc.innerHTML = '<span class="text-emerald-600 font-bold flex items-center gap-1"><i class="ph ph-cloud-arrow-up animate-pulse text-sm"></i> Menyimpan ke Google Drive...</span>';

        uploadToGoogleDrive(webhookUrl).then(result => {
            if (qrSpinner) qrSpinner.classList.add('hidden');
            if (result && result.success && result.folderUrl) {
                sessionData.gdriveUrl = result.folderUrl;
                if (typeof SessionDB !== 'undefined') {
                    SessionDB.saveSession(sessionData);
                }
                if (gdriveBadge) gdriveBadge.classList.remove('hidden');
                if (btnOpenGdrive) {
                    btnOpenGdrive.href = result.folderUrl;
                    btnOpenGdrive.classList.remove('hidden');
                    btnOpenGdrive.classList.add('flex');
                }
                if (btnSetupGdrive) btnSetupGdrive.classList.add('hidden');
                if (qrDesc) qrDesc.innerHTML = '<span class="text-emerald-600 font-semibold flex items-center gap-1"><i class="ph ph-check-circle"></i> Tersimpan di Google Drive!</span> Scan QR ini di HP untuk membuka galeri hasil & unduh ke Drive.';
            } else {
                console.warn("Google Drive upload response:", result);
                if (qrDesc) qrDesc.innerHTML = '<span class="text-slate-600">Scan QR di atas untuk membuka galeri hasil di HP pelanggan.</span>';
            }
        }).catch(err => {
            if (qrSpinner) qrSpinner.classList.add('hidden');
            console.error("Google Drive upload error:", err);
            if (qrDesc) qrDesc.innerHTML = '<span class="text-slate-600">Scan QR di atas untuk membuka galeri hasil di HP pelanggan.</span>';
        });
    } else {
        if (gdriveBadge) gdriveBadge.classList.add('hidden');
        if (btnOpenGdrive) {
            btnOpenGdrive.classList.add('hidden');
            btnOpenGdrive.classList.remove('flex');
        }
        if (btnSetupGdrive) btnSetupGdrive.classList.remove('hidden');
        if (qrDesc) qrDesc.textContent = "Scan QR ini di HP untuk membuka galeri hasil foto, video motion, dan mendownload langsung ke HP.";
    }
}

// ================= GOOGLE DRIVE UPLOADER HELPER =================
async function uploadToGoogleDrive(webhookUrl) {
    try {
        let gifBase64 = null;
        if (finalAnimFrames && finalAnimFrames.length > 0) {
            gifBase64 = await new Promise(resolve => {
                gifshot.createGIF({
                    images: finalAnimFrames,
                    interval: 0.16,
                    gifWidth: 360,
                    gifHeight: 270,
                    numFrames: 10
                }, function(obj) {
                    if (!obj.error && obj.image) resolve(obj.image);
                    else resolve(null);
                });
            });
        }

        const payload = {
            sessionName: 'Photobooth_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19),
            stripJpgBase64: finalStripImageUrl || null,
            stripPngBase64: finalStripPngUrl || null,
            gifBase64: gifBase64 || null,
            rawShots: frameUntukGif || []
        };

        const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        return data;
    } catch (err) {
        console.error("uploadToGoogleDrive error:", err);
        return { success: false, error: err.message };
    }
}

// ================= OUTPUT 2: LIVE VIDEO FRAME EXPORT ENGINE =================
async function downloadLiveVideoFrameMP4() {
    if (!currentSelectedFrame) return;
    const btn = document.getElementById('btnDownloadLiveVideo');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-base"></i> Merender Video Frame...';
    btn.disabled = true;

    try {
        const frameWidth = currentSelectedFrame.width;
        const frameHeight = currentSelectedFrame.height;
        const scale = 2;
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = frameWidth * scale;
        exportCanvas.height = frameHeight * scale;
        const ctx = exportCanvas.getContext('2d');

        const offscreen = document.getElementById('offscreenRenderContainer');
        offscreen.style.width = frameWidth + 'px';
        offscreen.style.height = frameHeight + 'px';
        offscreen.innerHTML = currentSelectedFrame.html;

        const offSlots = offscreen.querySelectorAll('.drop-slot');
        offSlots.forEach(s => {
            s.innerHTML = '';
            s.classList.remove('border-dashed');
            s.style.borderStyle = 'none';
            s.style.backgroundColor = 'transparent';
        });

        const overlayCanvas = await html2canvas(offscreen, {
            scale: scale,
            useCORS: true,
            backgroundColor: null,
            logging: false
        });

        const slotVideoData = [];
        const editorSlots = document.querySelectorAll('#frameEditor .drop-slot');

        for (let i = 0; i < offSlots.length; i++) {
            const slot = offSlots[i];
            const edSlot = editorSlots[i];
            const shotIdx = edSlot ? parseInt(edSlot.dataset.shotIndex ?? i) : (i % frameUntukGif.length);
            const videoSrc = liveVideos[shotIdx];
            const photoSrc = frameUntukGif[shotIdx];

            const relX = (slot.offsetLeft / frameWidth) * exportCanvas.width;
            const relY = (slot.offsetTop / frameHeight) * exportCanvas.height;
            const relW = (slot.offsetWidth / frameWidth) * exportCanvas.width;
            const relH = (slot.offsetHeight / frameHeight) * exportCanvas.height;

            let vidElement = null;
            let photoElement = null;

            if (videoSrc) {
                vidElement = document.createElement('video');
                vidElement.src = videoSrc;
                vidElement.muted = true;
                vidElement.playsInline = true;
                vidElement.currentTime = 0;
                await new Promise((res) => {
                    vidElement.onloadeddata = () => res();
                    vidElement.onerror = () => res();
                    vidElement.load();
                });
            } else if (photoSrc) {
                photoElement = new Image();
                photoElement.src = photoSrc;
                await new Promise(res => { 
                    photoElement.onload = () => res(); 
                    photoElement.onerror = () => res();
                });
            }

            slotVideoData.push({
                x: relX,
                y: relY,
                w: relW,
                h: relH,
                video: vidElement,
                photo: photoElement
            });
        }

        offscreen.innerHTML = '';

        const stream = exportCanvas.captureStream(30);
        let mimeType = 'video/mp4';
        if (!MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
        }

        const recorder = new MediaRecorder(stream, { mimeType: mimeType });
        const chunks = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

        recorder.onstop = () => {
            btn.innerHTML = originalText; 
            btn.disabled = false;
            const blob = new Blob(chunks, { type: mimeType });
            const a = document.createElement('a'); 
            a.href = URL.createObjectURL(blob); 
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            a.download = `photobooth_live_motion_${Date.now()}.${ext}`; 
            a.click();
        };

        slotVideoData.forEach(item => {
            if (item.video) {
                item.video.currentTime = 0;
                item.video.play().catch(()=>{});
            }
        });

        recorder.start();

        let frameCount = 0;
        const totalFrames = 105; 
        const canvasFilter = filters[currentFilter].canvasFilter;

        function renderExportFrame() {
            ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

            slotVideoData.forEach(item => {
                ctx.save();
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(item.x, item.y, item.w, item.h, 10 * scale);
                } else {
                    ctx.rect(item.x, item.y, item.w, item.h);
                }
                ctx.clip();

                ctx.filter = canvasFilter;
                if (item.video && item.video.readyState >= 2) {
                    drawImageCover(ctx, item.video, item.x, item.y, item.w, item.h);
                } else if (item.photo) {
                    drawImageCover(ctx, item.photo, item.x, item.y, item.w, item.h);
                }
                ctx.restore();
            });

            ctx.drawImage(overlayCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

            frameCount++;
            if (frameCount < totalFrames) {
                requestAnimationFrame(renderExportFrame);
            } else {
                recorder.stop();
                slotVideoData.forEach(item => {
                    if (item.video) item.video.pause();
                });
            }
        }

        renderExportFrame();

    } catch (err) {
        console.error("Live video export error:", err);
        alert("Gagal merender video live motion.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ================= OUTPUT 3: ANIMATED GIF ENGINE =================
function startAnimPreview() {
    if (animIntervalId) clearInterval(animIntervalId);
    if (finalAnimFrames.length === 0) return;
    
    const speedMs = parseInt(document.getElementById('animSpeed').value);
    const paddingVal = document.getElementById('animBorder').value + '%';
    const bgColor = document.getElementById('animColor').value;
    
    const container = document.getElementById('animPreviewContainer');
    if (container) {
        container.style.padding = paddingVal;
        container.style.backgroundColor = bgColor;
    }
    
    const liveImg = document.getElementById('liveAnimImg');
    if (liveImg) {
        liveImg.src = finalAnimFrames[currentAnimFrameIndex] || finalAnimFrames[0];
        
        animIntervalId = setInterval(() => {
            currentAnimFrameIndex = (currentAnimFrameIndex + 1) % finalAnimFrames.length;
            liveImg.src = finalAnimFrames[currentAnimFrameIndex];
        }, speedMs);
    }
}

async function downloadGifImage() {
    const btn = document.getElementById('btnDownloadGif');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-base"></i> Membuat GIF...';
    btn.disabled = true;

    const speedSec = parseInt(document.getElementById('animSpeed').value) / 1000;
    const paddingVal = parseInt(document.getElementById('animBorder').value); 
    const bgColor = document.getElementById('animColor').value;
    
    const framesWithBorder = await Promise.all(finalAnimFrames.map(src => {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 400; 
                canvas.height = 300;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                if (paddingVal > 0) {
                    const padX = (paddingVal / 100) * canvas.width;
                    const padY = (paddingVal / 100) * canvas.height;
                    drawImageCover(ctx, img, padX, padY, canvas.width - (padX * 2), canvas.height - (padY * 2));
                } else {
                    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);
                }
                resolve(canvas.toDataURL('image/jpeg', 0.92));
            };
            img.onerror = () => resolve(src);
            img.src = src;
        });
    }));

    gifshot.createGIF({
        images: framesWithBorder,
        interval: speedSec,
        gifWidth: 400,
        gifHeight: 300,
        numFrames: 10,
        sampleInterval: 10
    }, function(obj) {
        btn.innerHTML = originalText; 
        btn.disabled = false;
        if (!obj.error) {
            const a = document.createElement('a'); 
            a.href = obj.image; 
            a.download = `photobooth_animated_${Date.now()}.gif`; 
            a.click();
        } else { 
            alert('Gagal membuat GIF'); 
        }
    });
}

// ================= MASTER ACTION: DOWNLOAD ALL (ZIP) =================
async function downloadAllMomentsZip() {
    const btn = document.getElementById('btnDownloadAllZip');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> Mengemas ZIP File...';
    btn.disabled = true;

    try {
        const zip = new JSZip();
        const timestamp = Date.now();

        // 1. Add Photo Strip JPG
        if (finalStripBlob) {
            zip.file(`photobooth_strip_${timestamp}.jpg`, finalStripBlob);
        } else if (finalStripImageUrl) {
            const base64Data = finalStripImageUrl.replace(/^data:image\/jpeg;base64,/, "");
            zip.file(`photobooth_strip_${timestamp}.jpg`, base64Data, { base64: true });
        }

        // 2. Add Individual Still Photos Folder
        const photosFolder = zip.folder("individual_photos");
        frameUntukGif.forEach((src, idx) => {
            const b64 = src.replace(/^data:image\/jpeg;base64,/, "");
            photosFolder.file(`pose_${idx + 1}.jpg`, b64, { base64: true });
        });

        // 3. Add Individual Live Video Clips
        const clipsFolder = zip.folder("live_clips");
        liveVideoBlobs.forEach((blob, idx) => {
            if (blob) {
                clipsFolder.file(`pose_${idx + 1}_motion.webm`, blob);
            }
        });

        // 4. Generate Looping GIF and add to ZIP
        const gifBlob = await new Promise((resolve) => {
            gifshot.createGIF({
                images: finalAnimFrames,
                interval: 0.16,
                gifWidth: 400,
                gifHeight: 300
            }, function(obj) {
                if (!obj.error && obj.image) {
                    fetch(obj.image).then(r => r.blob()).then(resolve).catch(() => resolve(null));
                } else {
                    resolve(null);
                }
            });
        });

        if (gifBlob) {
            zip.file(`photobooth_gif_${timestamp}.gif`, gifBlob);
        }

        // Generate ZIP file and trigger download
        const zipContent = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipContent);
        a.download = `photobooth_all_moments_${timestamp}.zip`;
        a.click();

    } catch (err) {
        console.error("ZIP Generation error:", err);
        alert("Gagal mengemas file ZIP.");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ================= BIND FINISH EDITING TO RENDER PIPELINE =================
function initExportEngineEvents() {
    const btnSelesaiEdit = document.getElementById('btnSelesaiEdit');
    const stateResults = document.getElementById('state-results') || document.getElementById('stateResults');
    const stateBuilder = document.getElementById('state-builder') || document.getElementById('stateBuilder');
    const loadingResults = document.getElementById('loadingResults');
    const resultsGrid = document.getElementById('resultsGrid');
    const masterActionBar = document.getElementById('masterActionBar');
    const qrSection = document.getElementById('qrSection');
    const loadingText = document.getElementById('loadingText');

    if (btnSelesaiEdit) {
        btnSelesaiEdit.addEventListener('click', async () => {
            if (!currentSelectedFrame) {
                alert("Harap pilih salah satu template frame terlebih dahulu!");
                return;
            }

            const originalBtnHtml = btnSelesaiEdit.innerHTML;
            btnSelesaiEdit.innerHTML = '<i class="ph ph-spinner animate-spin text-xl"></i> MEMPROSES...';
            btnSelesaiEdit.disabled = true;

            try {
                if (stateResults) stateResults.classList.remove('hide');
                if (loadingResults) loadingResults.classList.remove('hide');
                if (resultsGrid) resultsGrid.classList.add('hide');
                if (masterActionBar) masterActionBar.classList.add('hide');
                if (qrSection) qrSection.classList.add('hide');

                if (loadingText) loadingText.innerText = "MENGGAMBAR PHOTO STRIP ULTRA-HD...";

                // 1. OFFSCREEN PIXEL-PERFECT RENDERING (OUTPUT 1)
                const offscreen = document.getElementById('offscreenRenderContainer');
                offscreen.style.width = currentSelectedFrame.width + 'px';
                offscreen.style.height = currentSelectedFrame.height + 'px';
                offscreen.innerHTML = currentSelectedFrame.html;

                const editorSlots = document.querySelectorAll('#frameEditor .drop-slot');
                const offscreenSlots = offscreen.querySelectorAll('.drop-slot');

                const canvasFilter = filters[currentFilter].canvasFilter;

                for (let i = 0; i < offscreenSlots.length; i++) {
                    const offSlot = offscreenSlots[i];
                    const edSlot = editorSlots[i];
                    const shotIdx = edSlot ? parseInt(edSlot.dataset.shotIndex ?? i) : (i % frameUntukGif.length);
                    const originalPhotoSrc = frameUntukGif[shotIdx];

                    offSlot.classList.remove('border-dashed');
                    offSlot.style.borderStyle = 'none';
                    offSlot.style.backgroundColor = 'transparent';

                    if (originalPhotoSrc) {
                        const slotW = offSlot.offsetWidth || (offSlot.clientWidth || 300);
                        const slotH = offSlot.offsetHeight || (offSlot.clientHeight || 200);
                        const filteredPhotoSrc = await renderCroppedPhotoForSlot(originalPhotoSrc, slotW, slotH, canvasFilter);
                        offSlot.innerHTML = `<img src="${filteredPhotoSrc}" style="width:100%; height:100%; display:block; object-fit:cover;" />`;
                    } else {
                        offSlot.innerHTML = '';
                        offSlot.style.backgroundColor = '#e5e7eb';
                    }
                }

                // Wait for all images in offscreen container to load
                const imgs = Array.from(offscreen.querySelectorAll('img'));
                await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(r => { img.onload = r; img.onerror = r; })));

                const canvas = await html2canvas(offscreen, { 
                    scale: 2.5, 
                    useCORS: true, 
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });

                finalStripImageUrl = canvas.toDataURL('image/jpeg', 0.96);
                finalStripPngUrl = canvas.toDataURL('image/png');
                
                await new Promise(resolve => {
                    canvas.toBlob((blob) => {
                        finalStripBlob = blob;
                        resolve();
                    }, 'image/jpeg', 0.96);
                });

                offscreen.innerHTML = '';
                if (stateBuilder) stateBuilder.classList.add('hide');

                // 2. SETUP OUTPUT 2: Live Video Frame Preview
                if (loadingText) loadingText.innerText = "MENYIAPKAN FRAME VIDEO LIVE...";
                setupLiveVideoFramePreview();

                // 3. SETUP OUTPUT 3: Looping GIF Frames
                if (loadingText) loadingText.innerText = "MENYIAPKAN ANIMASI GIF...";
                finalAnimFrames = frameUntukGif;
                if (currentFilter !== 'none') {
                    finalAnimFrames = await Promise.all(frameUntukGif.map(src => applyCanvasFilter(src, canvasFilter)));
                }

                if (loadingResults) loadingResults.classList.add('hide'); 
                if (resultsGrid) resultsGrid.classList.remove('hide');
                if (masterActionBar) masterActionBar.classList.remove('hide');
                if (qrSection) qrSection.classList.remove('hide');

                prosesHasil();
            } catch (error) {
                console.error("Error rendering results:", error);
                alert("Terjadi kesalahan saat memproses gambar.");
                if (loadingResults) loadingResults.classList.add('hide');
                if (stateBuilder) stateBuilder.classList.remove('hide');
                if (stateResults) stateResults.classList.add('hide');
            } finally {
                btnSelesaiEdit.innerHTML = originalBtnHtml; 
                btnSelesaiEdit.disabled = false;
            }
        });
    }

    const animSpeed = document.getElementById('animSpeed');
    const animBorder = document.getElementById('animBorder');
    const animColor = document.getElementById('animColor');

    if (animSpeed) animSpeed.addEventListener('input', startAnimPreview);
    if (animBorder) animBorder.addEventListener('input', startAnimPreview);
    if (animColor) animColor.addEventListener('input', startAnimPreview);
}
