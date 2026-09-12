/**
 * Photobooth Pro - Builder & Frame Decorator Engine
 * Fitur: Mengatur tata letak foto pada frame, drag-and-drop & tap to place, pewarnaan filter kanvas, dan scaling responsif.
 */

// ================= SETUP BUILDER UI =================
function setupBuilder() {
    // Populate photo palette
    const photoList = document.getElementById('builderPhotos'); 
    if (!photoList) return;
    photoList.innerHTML = '';
    activeSelectedPhotoIdx = 0;
    
    frameUntukGif.forEach((src, idx) => {
        const card = document.createElement('div');
        card.id = `palette-card-${idx}`;
        card.className = `relative w-full aspect-[4/3] group bg-white rounded-xl overflow-hidden border cursor-pointer transition shadow-xs ${idx === 0 ? 'selected-photo-card border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-slate-400'}`;
        
        const img = document.createElement('img'); 
        img.src = src;
        img.className = 'user-photo w-full h-full object-cover pointer-events-none';
        img.style.filter = filters[currentFilter].css; 
        
        const badge = document.createElement('div');
        badge.className = 'absolute top-1 left-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow';
        badge.innerHTML = `<i class="ph ph-camera text-blue-400"></i> #${idx + 1}`;

        // Touch & Click Selection Support
        card.onclick = () => {
            activeSelectedPhotoIdx = idx;
            document.querySelectorAll('#builderPhotos > div').forEach((c, i) => {
                c.classList.toggle('selected-photo-card', i === idx);
                c.classList.toggle('border-blue-600', i === idx);
                c.classList.toggle('ring-2', i === idx);
                c.classList.toggle('ring-blue-500/30', i === idx);
            });
        };

        // Desktop Drag & Drop Support
        card.draggable = true;
        card.ondragstart = (e) => { 
            activeSelectedPhotoIdx = idx;
            e.dataTransfer.setData("text/plain", idx.toString()); 
        };

        card.appendChild(img);
        card.appendChild(badge);
        photoList.appendChild(card);
    });

    // Populate Frames List
    if (typeof renderFramesListUI === 'function') renderFramesListUI();

    // Select default matching frame or first available frame
    if (frames.length > 0) {
        const defaultFrame = frames.find(f => f.slotCount === totalFoto) || frames[0];
        selectFrame(defaultFrame);
    }

    // Populate Filter list
    const filterList = document.getElementById('filterList');
    if (filterList) {
        filterList.innerHTML = '';
        const previewSrc = frameUntukGif[0] || '';
        Object.keys(filters).forEach(key => {
            const f = filters[key];
            const btn = document.createElement('div');
            btn.className = `cursor-pointer border-2 rounded-2xl p-2.5 text-center bg-white transition-all hover:scale-[1.02] filter-btn shadow-xs ${currentFilter === key ? 'border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-slate-300'}`;
            btn.innerHTML = `
                <div class="w-full h-16 bg-slate-100 rounded-xl mb-2 overflow-hidden flex items-center justify-center border border-slate-200">
                    <img src="${previewSrc}" class="w-full h-full object-cover" style="filter: ${f.css}">
                </div>
                <div class="text-[11px] font-bold text-slate-800">${f.name}</div>
            `;
            btn.onclick = () => applyGlobalFilter(key, btn);
            filterList.appendChild(btn);
        });
    }
}

// ================= SELECT & POPULATE FRAME =================
function selectFrame(frameDef) {
    if (!frameDef) return;
    currentSelectedFrame = frameDef;

    // Highlight selected frame in sidebar list
    const allCards = document.querySelectorAll('.frame-item-card');
    allCards.forEach(card => {
        const isActive = card.dataset.frameId === frameDef.id;
        card.classList.toggle('is-active', isActive);
        const badge = card.querySelector('.active-badge');
        if (badge) badge.classList.toggle('hidden', !isActive);
        if (badge) badge.classList.toggle('flex', isActive);
    });

    // Set dimensions & markup of editor
    const editor = document.getElementById('frameEditor');
    if (!editor) return;

    editor.style.width = frameDef.width + 'px'; 
    editor.style.height = frameDef.height + 'px'; 
    editor.innerHTML = frameDef.html;
    
    // Populate photo slots
    const slots = editor.querySelectorAll('.drop-slot');
    slots.forEach((slot, slotIdx) => {
        const autoShotIdx = slotIdx < frameUntukGif.length ? slotIdx : (slotIdx % frameUntukGif.length);
        if (frameUntukGif[autoShotIdx]) {
            assignPhotoToSlot(slot, autoShotIdx);
        }

        // Click / Tap to Place Support (Mobile Friendly)
        slot.onclick = () => {
            if (activeSelectedPhotoIdx !== null && frameUntukGif[activeSelectedPhotoIdx]) {
                assignPhotoToSlot(slot, activeSelectedPhotoIdx);
            }
        };

        // Drag & Drop Listeners
        slot.ondragover = (e) => { 
            e.preventDefault(); 
            slot.classList.add('scale-95', 'ring-4', 'ring-blue-500', 'ring-inset', 'opacity-90', 'brightness-110'); 
        };
        slot.ondragleave = () => { 
            slot.classList.remove('scale-95', 'ring-4', 'ring-blue-500', 'ring-inset', 'opacity-90', 'brightness-110'); 
        };
        slot.ondrop = (e) => {
            e.preventDefault(); 
            slot.classList.remove('scale-95', 'ring-4', 'ring-blue-500', 'ring-inset', 'opacity-90', 'brightness-110');
            const shotIdxStr = e.dataTransfer.getData("text/plain");
            const shotIdx = parseInt(shotIdxStr !== "" ? shotIdxStr : activeSelectedPhotoIdx);
            if (!isNaN(shotIdx) && frameUntukGif[shotIdx]) {
                assignPhotoToSlot(slot, shotIdx);
            }
        };
    });

    setTimeout(adjustFrameScale, 30);
}

window.slotTransforms = {};

function assignPhotoToSlot(slot, shotIdx) {
    slot.dataset.shotIndex = shotIdx;
    const filterCSS = filters[currentFilter].css;
    const isCustom = currentSelectedFrame && currentSelectedFrame.isCustom;
    
    // Remove pointer-events-none so img can receive pan/zoom events
    slot.innerHTML = `<img src="${frameUntukGif[shotIdx]}" class="user-photo w-full h-full object-cover select-none" style="filter: ${filterCSS}; cursor: grab;" />`;
    
    slot.classList.remove('border-dashed'); 
    slot.style.borderStyle = 'none'; 
    slot.style.backgroundColor = 'transparent'; 
    
    if (isCustom) {
        slot.style.overflow = 'visible'; // Let user pan outside the boundaries
    } else {
        slot.style.overflow = 'hidden';
    }

    // Visual feedback for placement
    slot.style.transform = 'scale(0.8)';
    setTimeout(() => {
        slot.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        slot.style.transform = 'scale(1)';
    }, 20);

    setupPanZoom(slot);
}

function setupPanZoom(slot) {
    const slotId = slot.dataset.slot || slot.getAttribute('data-slot');
    if (!slotId) return;

    if (!window.slotTransforms[slotId]) {
        window.slotTransforms[slotId] = { x: 0, y: 0, scale: 1 };
    }

    const img = slot.querySelector('img.user-photo');
    if (!img) return;

    // Clean up old listeners on this img if it was re-assigned
    if (img._hasPanZoom) return;
    img._hasPanZoom = true;

    let isDragging = false;
    let startX, startY, initialTx, initialTy;
    let initialDistance = 0, initialScale = 1;

    const applyTransform = () => {
        const t = window.slotTransforms[slotId];
        img.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    };
    applyTransform();

    img.addEventListener('mousedown', (e) => {
        isDragging = true;
        img.style.cursor = 'grabbing';
        startX = e.clientX;
        startY = e.clientY;
        initialTx = window.slotTransforms[slotId].x;
        initialTy = window.slotTransforms[slotId].y;
        e.preventDefault(); 
    });

    img.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            initialDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            initialScale = window.slotTransforms[slotId].scale;
        } else {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialTx = window.slotTransforms[slotId].x;
            initialTy = window.slotTransforms[slotId].y;
        }
        // Don't preventDefault here to allow native drop bubbling if needed, but it stops scrolling.
        // If we want smooth pan, we must prevent default.
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        const stage = document.getElementById('frameEditor');
        const rect = stage.getBoundingClientRect();
        const stageScale = rect.width / (currentSelectedFrame ? currentSelectedFrame.width : 400);

        const dx = (clientX - startX) / stageScale;
        const dy = (clientY - startY) / stageScale;

        window.slotTransforms[slotId].x = initialTx + dx;
        window.slotTransforms[slotId].y = initialTy + dy;
        applyTransform();
    };

    window.addEventListener('mousemove', (e) => {
        onMove(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            const currentDistance = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const pinchScale = currentDistance / initialDistance;
            let newScale = initialScale * pinchScale;
            newScale = Math.max(0.1, Math.min(newScale, 5));
            window.slotTransforms[slotId].scale = newScale;
            applyTransform();
            if (e.cancelable) e.preventDefault();
            return;
        }
        if (isDragging) {
            onMove(e.touches[0].clientX, e.touches[0].clientY);
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        img.style.cursor = 'grab';
    });
    window.addEventListener('touchend', () => {
        isDragging = false;
        initialDistance = 0;
    });

    img.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        let newScale = window.slotTransforms[slotId].scale + delta;
        newScale = Math.max(0.1, Math.min(newScale, 5));
        window.slotTransforms[slotId].scale = newScale;
        applyTransform();
    }, { passive: false });
}

function adjustFrameScale() {
    const wrapper = document.getElementById('frameWrapper');
    const editor = document.getElementById('frameEditor');
    if (!wrapper || !editor || !currentSelectedFrame) return;
    const centerArea = wrapper.parentElement;
    if (!centerArea) return;
    
    // Dynamically calculate based on center stage dimensions and tablet safe margins
    const availableW = Math.max(80, centerArea.clientWidth - 36);
    const availableH = Math.max(80, centerArea.clientHeight - 80);
    const targetW = editor.offsetWidth || currentSelectedFrame.width || 400;
    const targetH = editor.offsetHeight || currentSelectedFrame.height || 600;
    
    const scale = Math.min(availableW / targetW, availableH / targetH, 1.2); 
    wrapper.style.transform = `scale(${Math.max(0.25, Math.round(scale * 1000) / 1000)})`;
}

function applyGlobalFilter(filterId, btnElement) {
    currentFilter = filterId; 
    const filterCSS = filters[filterId].css;
    document.querySelectorAll('.filter-btn').forEach(d => {
        d.classList.remove('border-blue-600', 'ring-2', 'ring-blue-500/30');
        d.classList.add('border-slate-200');
    });
    if (btnElement) {
        btnElement.classList.add('border-blue-600', 'ring-2', 'ring-blue-500/30');
        btnElement.classList.remove('border-slate-200');
    }
    document.querySelectorAll('.user-photo, .user-video').forEach(el => { el.style.filter = filterCSS; });
}

// ================= CANVAS FILTER HELPER (PERMANENT BAKING) =================
function applyCanvasFilter(src, filterStr) {
    return new Promise((resolve) => {
        if (!src) return resolve('');
        if (!filterStr || filterStr === 'none') return resolve(src);
        const img = new Image();
        img.onload = () => {
            const nw = img.naturalWidth || img.width || 900;
            const nh = img.naturalHeight || img.height || 675;
            const canvas = document.createElement('canvas');
            canvas.width = nw; 
            canvas.height = nh;
            const ctx = canvas.getContext('2d');
            ctx.filter = filterStr; 
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.96));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
}
