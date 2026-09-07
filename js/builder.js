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
        card.className = `relative group bg-white rounded-xl overflow-hidden border cursor-pointer transition shadow-xs ${idx === 0 ? 'selected-photo-card border-blue-600 ring-2 ring-blue-500/30' : 'border-slate-200 hover:border-slate-400'}`;
        
        const img = document.createElement('img'); 
        img.src = src;
        img.className = 'user-photo w-full h-20 md:h-24 object-cover pointer-events-none';
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
            slot.classList.add('scale-95', 'opacity-75'); 
        };
        slot.ondragleave = () => { 
            slot.classList.remove('scale-95', 'opacity-75'); 
        };
        slot.ondrop = (e) => {
            e.preventDefault(); 
            slot.classList.remove('scale-95', 'opacity-75');
            const shotIdxStr = e.dataTransfer.getData("text/plain");
            const shotIdx = parseInt(shotIdxStr !== "" ? shotIdxStr : activeSelectedPhotoIdx);
            if (!isNaN(shotIdx) && frameUntukGif[shotIdx]) {
                assignPhotoToSlot(slot, shotIdx);
            }
        };
    });

    setTimeout(adjustFrameScale, 30);
}

function assignPhotoToSlot(slot, shotIdx) {
    slot.dataset.shotIndex = shotIdx;
    const filterCSS = filters[currentFilter].css;
    slot.innerHTML = `<img src="${frameUntukGif[shotIdx]}" class="user-photo w-full h-full object-cover pointer-events-none select-none" style="filter: ${filterCSS}" />`;
    slot.classList.remove('border-dashed'); 
    slot.style.borderStyle = 'none'; 
    slot.style.backgroundColor = 'transparent'; 
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
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 800; 
            canvas.height = img.height || 600;
            const ctx = canvas.getContext('2d');
            ctx.filter = filterStr; 
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = () => resolve(src);
        img.src = src;
    });
}
