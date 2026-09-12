/**
 * Photobooth Pro - Custom Frame Studio & Green Screen Engine
 * Fitur: Studio upload frame kustom PNG/JPG, AI deteksi green screen otomatis, chroma-key transparansi, dan editor posisi slot interaktif.
 */

// Custom Studio In-Memory State
let customFrameNaturalWidth = 400;
let customFrameNaturalHeight = 600;
let customOriginalDataUrl = null;
let customProcessedOverlayUrl = null;
let customSlots = []; // Array of { id, x, y, w, h }
let activeCustomSlotId = null;

// ================= GREEN SCREEN DETECTION & TRANSPARENCY ALGORITHMS =================
function detectGreenScreenBoxes(imgElement) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 800 / Math.max(imgElement.naturalWidth, imgElement.naturalHeight));
    canvas.width = Math.round(imgElement.naturalWidth * scale);
    canvas.height = Math.round(imgElement.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    const mask = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 50) {
            const isGreen = (g > 100 && g > r * 1.22 && g > b * 1.22) ||
                            (g > 130 && Math.abs(r - b) < 65 && g > (r + b) * 0.75);
            if (isGreen) {
                mask[i / 4] = 1;
            }
        }
    }

    const visited = new Uint8Array(w * h);
    const boxes = [];
    const minPixelCount = (w * h) * 0.007;

    for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
            const idx = y * w + x;
            if (mask[idx] === 1 && visited[idx] === 0) {
                let minX = x, maxX = x, minY = y, maxY = y;
                let count = 0;
                const queue = [x, y];
                visited[idx] = 1;

                while (queue.length > 0) {
                    const cy = queue.pop();
                    const cx = queue.pop();
                    count++;

                    if (cx < minX) minX = cx;
                    if (cx > maxX) maxX = cx;
                    if (cy < minY) minY = cy;
                    if (cy > maxY) maxY = cy;

                    const neighbors = [
                        [cx + 2, cy], [cx - 2, cy],
                        [cx, cy + 2], [cx - 2, cy]
                    ];
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            const nidx = ny * w + nx;
                            if (mask[nidx] === 1 && visited[nidx] === 0) {
                                visited[nidx] = 1;
                                queue.push(nx, ny);
                            }
                        }
                    }
                }

                const boxW = (maxX - minX + 1);
                const boxH = (maxY - minY + 1);
                if (count >= minPixelCount && boxW >= 24 && boxH >= 24) {
                    boxes.push({
                        x: Math.round(minX / scale),
                        y: Math.round(minY / scale),
                        w: Math.round(boxW / scale),
                        h: Math.round(boxH / scale)
                    });
                }
            }
        }
    }

    boxes.sort((a, b) => (a.y - b.y) !== 0 ? (a.y - b.y) : (a.x - b.x));
    return boxes;
}

function makeGreenScreenTransparent(imgElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 30) {
            const isGreen = (g > 100 && g > r * 1.22 && g > b * 1.22) ||
                            (g > 130 && Math.abs(r - b) < 65 && g > (r + b) * 0.75);
            if (isGreen) {
                data[i + 3] = 0;
            }
        }
    }

    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL('image/png');
}

function createDefaultSlots(w, h, count) {
    const list = [];
    const marginX = Math.round(w * 0.08);
    const slotW = Math.round(w - (marginX * 2));
    const availableH = Math.round(h * 0.84);
    const slotH = Math.round((availableH / count) * 0.88);
    const gapY = Math.round((availableH - (slotH * count)) / (count + 1));
    let startY = Math.round(h * 0.08) + gapY;

    for (let i = 0; i < count; i++) {
        list.push({
            id: 'slot_' + (i + 1),
            x: marginX,
            y: startY + (i * (slotH + gapY)),
            w: slotW,
            h: slotH
        });
    }
    return list;
}

function adjustCustomStageScale() {
    const customEditorStageWrapper = document.getElementById('customEditorStageWrapper');
    const customEditorStage = document.getElementById('customEditorStage');
    if (!customEditorStageWrapper || customEditorStageWrapper.classList.contains('hide') || !customEditorStage) return;
    const container = customEditorStageWrapper;
    const maxW = container.clientWidth - 40;
    const maxH = container.clientHeight - 40;
    const scale = Math.min(maxW / customFrameNaturalWidth, maxH / customFrameNaturalHeight, 0.95);
    customEditorStage.style.transform = `scale(${Math.max(0.2, scale)})`;
}

// ================= RENDER CUSTOM SLOTS UI & INTERACTIVITY =================
function renderCustomSlotsUI() {
    const customSlotsOverlay = document.getElementById('customSlotsOverlay');
    const customSlotItemList = document.getElementById('customSlotItemList');
    const customSlotCountText = document.getElementById('customSlotCountText');
    if (!customSlotsOverlay) return;

    customSlotsOverlay.innerHTML = '';
    if (customSlotItemList) customSlotItemList.innerHTML = '';
    if (customSlotCountText) customSlotCountText.innerText = customSlots.length;

    customSlots.forEach((slot, idx) => {
        const box = document.createElement('div');
        box.className = `slot-editor-box rounded-lg pointer-events-auto ${activeCustomSlotId === slot.id ? 'active' : ''}`;
        box.style.left = slot.x + 'px';
        box.style.top = slot.y + 'px';
        box.style.width = slot.w + 'px';
        box.style.height = slot.h + 'px';

        box.innerHTML = `
            <div class="absolute top-1 left-1.5 bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow pointer-events-none">
                #${idx + 1}
            </div>
            <button class="btn-del-custom-slot absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center transition shadow pointer-events-auto text-xs" title="Hapus Slot">
                &times;
            </button>
            <!-- Resize Handles -->
            <div class="slot-handle nw" data-handle="nw"></div>
            <div class="slot-handle ne" data-handle="ne"></div>
            <div class="slot-handle sw" data-handle="sw"></div>
            <div class="slot-handle se" data-handle="se"></div>
            <div class="slot-handle n" data-handle="n"></div>
            <div class="slot-handle s" data-handle="s"></div>
            <div class="slot-handle w" data-handle="w"></div>
            <div class="slot-handle e" data-handle="e"></div>
        `;

        box.querySelector('.btn-del-custom-slot').onclick = (e) => {
            e.stopPropagation();
            customSlots = customSlots.filter(s => s.id !== slot.id);
            renderCustomSlotsUI();
        };

        setupSlotInteractivity(box, slot);
        customSlotsOverlay.appendChild(box);

        if (customSlotItemList) {
            const item = document.createElement('div');
            item.className = 'bg-slate-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-700';
            item.innerHTML = `
                <span class="font-bold flex items-center gap-1.5">
                    <span class="w-4 h-4 rounded bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">${idx + 1}</span>
                    Slot #${idx + 1}
                </span>
                <span class="text-[10px] text-slate-500 font-mono">${slot.w}&times;${slot.h}px</span>
            `;
            customSlotItemList.appendChild(item);
        }
    });
}

function setupSlotInteractivity(boxEl, slotData) {
    let isInteracting = false;
    let actionType = 'move';
    let handleType = null;
    let startClientX = 0, startClientY = 0;
    let startX = 0, startY = 0, startW = 0, startH = 0;

    function onPointerDown(e) {
        if (e.target.closest('.btn-del-custom-slot')) return;
        e.preventDefault();
        e.stopPropagation();

        activeCustomSlotId = slotData.id;
        isInteracting = true;

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        startClientX = clientX;
        startClientY = clientY;

        startX = slotData.x;
        startY = slotData.y;
        startW = slotData.w;
        startH = slotData.h;

        const handle = e.target.closest('.slot-handle');
        if (handle) {
            actionType = 'resize';
            handleType = handle.dataset.handle;
        } else {
            actionType = 'move';
        }

        document.querySelectorAll('.slot-editor-box').forEach(b => b.classList.remove('active'));
        boxEl.classList.add('active');

        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('mouseup', onPointerUp);
        window.addEventListener('touchend', onPointerUp);
    }

    function onPointerMove(e) {
        if (!isInteracting) return;
        e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const customEditorStage = document.getElementById('customEditorStage');
        const stageScale = customEditorStage.getBoundingClientRect().width / customFrameNaturalWidth || 1;
        const dx = (clientX - startClientX) / stageScale;
        const dy = (clientY - startClientY) / stageScale;

        const minSize = 30;

        if (actionType === 'move') {
            let newX = Math.round(startX + dx);
            let newY = Math.round(startY + dy);

            newX = Math.max(0, Math.min(customFrameNaturalWidth - slotData.w, newX));
            newY = Math.max(0, Math.min(customFrameNaturalHeight - slotData.h, newY));

            slotData.x = newX;
            slotData.y = newY;
        } else if (actionType === 'resize') {
            let newX = startX;
            let newY = startY;
            let newW = startW;
            let newH = startH;

            if (handleType.includes('e')) {
                newW = Math.max(minSize, Math.min(customFrameNaturalWidth - startX, Math.round(startW + dx)));
            }
            if (handleType.includes('s')) {
                newH = Math.max(minSize, Math.min(customFrameNaturalHeight - startY, Math.round(startH + dy)));
            }
            if (handleType.includes('w')) {
                const maxLeft = startX + startW - minSize;
                newX = Math.max(0, Math.min(maxLeft, Math.round(startX + dx)));
                newW = startW + (startX - newX);
            }
            if (handleType.includes('n')) {
                const maxTop = startY + startH - minSize;
                newY = Math.max(0, Math.min(maxTop, Math.round(startY + dy)));
                newH = startH + (startY - newY);
            }

            slotData.x = newX;
            slotData.y = newY;
            slotData.w = newW;
            slotData.h = newH;
        }

        boxEl.style.left = slotData.x + 'px';
        boxEl.style.top = slotData.y + 'px';
        boxEl.style.width = slotData.w + 'px';
        boxEl.style.height = slotData.h + 'px';
    }

    function onPointerUp() {
        isInteracting = false;
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('touchend', onPointerUp);
        renderCustomSlotsUI();
    }

    boxEl.addEventListener('mousedown', onPointerDown);
    boxEl.addEventListener('touchstart', onPointerDown, { passive: false });
}

// ================= FILE HANDLER =================
function handleCustomFrameFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const dataUrl = event.target.result;
        const img = new Image();
        img.onload = () => {
            // Compress and Resize Image to prevent QuotaExceededError
            const maxDimension = 1600;
            let scale = 1;
            if (img.naturalWidth > maxDimension || img.naturalHeight > maxDimension) {
                scale = Math.min(maxDimension / img.naturalWidth, maxDimension / img.naturalHeight);
            }
            
            const w = Math.round(img.naturalWidth * scale);
            const h = Math.round(img.naturalHeight * scale);
            
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = w;
            tmpCanvas.height = h;
            const tCtx = tmpCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0, w, h);
            
            // Use PNG to prevent loss of exact Green Screen RGB values!
            const processedUrl = tmpCanvas.toDataURL('image/png');

            customOriginalDataUrl = processedUrl;
            customProcessedOverlayUrl = processedUrl;
            customFrameNaturalWidth = w;
            customFrameNaturalHeight = h;

            const customFrameNameInput = document.getElementById('customFrameNameInput');
            const customUploadDropZone = document.getElementById('customUploadDropZone');
            const customEditorStageWrapper = document.getElementById('customEditorStageWrapper');
            const customFramePreviewImg = document.getElementById('customFramePreviewImg');
            const customEditorStage = document.getElementById('customEditorStage');

            // Set default frame name from file name
            const rawName = file.name.replace(/\.[^/.]+$/, "");
            if (customFrameNameInput) customFrameNameInput.value = rawName || "Custom Frame";

            // Show editor stage
            if (customUploadDropZone) customUploadDropZone.classList.add('hide');
            if (customEditorStageWrapper) customEditorStageWrapper.classList.remove('hide');
            if (customFramePreviewImg) customFramePreviewImg.src = processedUrl;
            if (customEditorStage) {
                customEditorStage.style.width = customFrameNaturalWidth + 'px';
                customEditorStage.style.height = customFrameNaturalHeight + 'px';
            }

            // Create compressed image element for detection
            const compressedImg = new Image();
            compressedImg.onload = () => {
                // Auto-Detect Green Screen on upload
                const detected = detectGreenScreenBoxes(compressedImg);
                if (detected && detected.length > 0) {
                    customSlots = detected.map((box, i) => ({
                        id: 'slot_' + (i + 1),
                        x: box.x,
                        y: box.y,
                        w: box.w,
                        h: box.h
                    }));
                    customProcessedOverlayUrl = makeGreenScreenTransparent(compressedImg);
                    if (customFramePreviewImg) customFramePreviewImg.src = customProcessedOverlayUrl;
                } else {
                    // Murni bebas! Tidak ada slot otomatis yang memaksa jumlah foto.
                    // User harus menambah slot secara manual.
                    customSlots = [];
                }

                renderCustomSlotsUI();
                setTimeout(adjustCustomStageScale, 50);
            };
            compressedImg.src = processedUrl;
        };
        img.src = dataUrl;
    };
    reader.readAsDataURL(file);
}

// ================= BIND CUSTOM FRAME STUDIO EVENTS =================
function initCustomFrameStudioEvents() {
    const customFrameModal = document.getElementById('customFrameModal');
    const btnOpenCustomModal = document.getElementById('btnOpenCustomModal');
    const btnCloseCustomModal = document.getElementById('btnCloseCustomModal');
    const btnChangeFrameImage = document.getElementById('btnChangeFrameImage');
    const customFrameFileInput = document.getElementById('customFrameFileInput');
    const customUploadDropZone = document.getElementById('customUploadDropZone');
    const btnAutoDetectGreenScreen = document.getElementById('btnAutoDetectGreenScreen');
    const btnAddSlotManual = document.getElementById('btnAddSlotManual');
    const btnSaveCustomFrame = document.getElementById('btnSaveCustomFrame');
    const customFrameNameInput = document.getElementById('customFrameNameInput');
    const customFramePreviewImg = document.getElementById('customFramePreviewImg');

    if (btnOpenCustomModal) {
        btnOpenCustomModal.onclick = () => {
            if (customFrameModal) customFrameModal.classList.remove('hide');
            if (!customOriginalDataUrl) {
                if (customUploadDropZone) customUploadDropZone.classList.remove('hide');
                const customEditorStageWrapper = document.getElementById('customEditorStageWrapper');
                if (customEditorStageWrapper) customEditorStageWrapper.classList.add('hide');
            } else {
                setTimeout(adjustCustomStageScale, 50);
            }
        };
    }

    if (btnCloseCustomModal && customFrameModal) {
        btnCloseCustomModal.onclick = () => customFrameModal.classList.add('hide');
    }

    if (btnChangeFrameImage && customFrameFileInput) {
        btnChangeFrameImage.onclick = () => customFrameFileInput.click();
    }

    if (customFrameFileInput) {
        customFrameFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) handleCustomFrameFile(file);
        };
    }

    if (customUploadDropZone) {
        customUploadDropZone.ondragover = (e) => { e.preventDefault(); customUploadDropZone.classList.add('border-blue-500'); };
        customUploadDropZone.ondragleave = () => { customUploadDropZone.classList.remove('border-blue-500'); };
        customUploadDropZone.ondrop = (e) => {
            e.preventDefault();
            customUploadDropZone.classList.remove('border-blue-500');
            const file = e.dataTransfer.files[0];
            if (file) handleCustomFrameFile(file);
        };
    }

    if (btnAutoDetectGreenScreen) {
        btnAutoDetectGreenScreen.onclick = () => {
            if (!customOriginalDataUrl) return;
            const img = new Image();
            img.onload = () => {
                const detected = detectGreenScreenBoxes(img);
                if (detected && detected.length > 0) {
                    customSlots = detected.map((box, i) => ({
                        id: 'slot_' + (i + 1),
                        x: box.x,
                        y: box.y,
                        w: box.w,
                        h: box.h
                    }));
                    customProcessedOverlayUrl = makeGreenScreenTransparent(img);
                    if (customFramePreviewImg) customFramePreviewImg.src = customProcessedOverlayUrl;
                    renderCustomSlotsUI();
                    alert(`✨ Berhasil mendeteksi ${detected.length} slot green screen!`);
                } else {
                    alert("Tidak ditemukan area hijau green screen yang jelas. Anda dapat mengatur posisi dan ukuran slot secara manual.");
                }
            };
            img.src = customOriginalDataUrl;
        };
    }

    if (btnAddSlotManual) {
        btnAddSlotManual.onclick = () => {
            const w = Math.round(customFrameNaturalWidth * 0.4);
            const h = Math.round(w * 0.75);
            const offset = (customSlots.length * 40) % (customFrameNaturalWidth * 0.3);
            const x = Math.round((customFrameNaturalWidth - w) / 2) + offset - (customFrameNaturalWidth * 0.15);
            const y = Math.round((customFrameNaturalHeight - h) / 2) + offset - (customFrameNaturalWidth * 0.15);
            
            customSlots.push({
                id: 'slot_' + Date.now(),
                x: x,
                y: y,
                w: w,
                h: h
            });
            renderCustomSlotsUI();
        };
    }

    if (btnSaveCustomFrame) {
        btnSaveCustomFrame.onclick = async () => {
            if (customSlots.length === 0) {
                alert("Harap buat minimal 1 slot foto pada frame!");
                return;
            }

            const frameName = (customFrameNameInput ? customFrameNameInput.value.trim() : '') || `Custom Frame (${customSlots.length} Slots)`;
            const frameId = 'custom_' + Date.now();
            const w = customFrameNaturalWidth;
            const h = customFrameNaturalHeight;
            const overlayUrl = customProcessedOverlayUrl || customOriginalDataUrl;

            let slotsHtml = customSlots.map((s, idx) => {
                const left = ((s.x / w) * 100).toFixed(2);
                const top = ((s.y / h) * 100).toFixed(2);
                const width = ((s.w / w) * 100).toFixed(2);
                const height = ((s.h / h) * 100).toFixed(2);
                return `<div class="drop-slot absolute bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-3xl font-black rounded-lg overflow-hidden transition-all shadow-inner z-10" data-slot="${idx + 1}" style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%;">${idx + 1}</div>`;
            }).join('\n');

            const frameHtml = `
                <div class="w-full h-full relative select-none overflow-hidden bg-white" style="width: 100%; height: 100%;">
                    ${slotsHtml}
                    <img src="${overlayUrl}" class="absolute inset-0 w-full h-full object-fill pointer-events-none z-20" alt="Frame Overlay" />
                </div>
            `;

            const newFrameDef = {
                id: frameId,
                name: frameName,
                isCustom: true,
                width: w,
                height: h,
                slotCount: customSlots.length,
                overlayUrl: overlayUrl,
                slots: customSlots.map(s => ({ ...s })),
                html: frameHtml
            };

            frames.push(newFrameDef);
            await FrameDB.saveFrame(newFrameDef);

            if (customFrameModal) customFrameModal.classList.add('hide');
            if (typeof renderFramesListUI === 'function') renderFramesListUI();
            if (typeof renderFrameManagerGrid === 'function') renderFrameManagerGrid();
            if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.renderDashFrames === 'function') {
                ThemeManager.renderDashFrames();
            }
            if (typeof selectFrame === 'function') selectFrame(newFrameDef);

            alert(`🎉 Frame "${frameName}" berhasil disimpan secara permanen dan dipilih!`);
        };
    }
}
