/**
 * Photobooth Pro - Frame Management & Presets
 * Fitur: Pengelolaan daftar template frame, mini preview generator, filter kategori, dan preset import/export pack.
 */

let frames = [...builtInFrames];
let currentFrameCategoryFilter = 'all';

// Load frames from IndexedDB (or seed with built-in on first run)
async function initFramesDatabase() {
    try {
        const stored = await FrameDB.getAllFrames();
        if (stored && stored.length > 0) {
            frames = stored;
        } else {
            frames = [...builtInFrames];
            await FrameDB.saveAllFrames(frames);
        }
    } catch(e) {
        console.error("Init frames DB error:", e);
        frames = [...builtInFrames];
    }
}

// ================= MINI FRAME PREVIEW GENERATOR =================
function generateMiniFramePreviewHtml(frame) {
    const w = 42;
    const h = Math.min(66, Math.max(34, Math.round(42 / (frame.width / frame.height))));
    
    if (frame.isCustom && frame.overlayUrl) {
        return `
            <div class="relative rounded-lg overflow-hidden bg-gray-200 border border-gray-700 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <img src="${frame.overlayUrl}" class="absolute inset-0 w-full h-full object-fill pointer-events-none z-10" />
            </div>
        `;
    }
    
    if (frame.id === 'korean_white_4') {
        return `
            <div class="rounded-lg overflow-hidden bg-white p-1 flex flex-col justify-between border border-gray-300 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="w-full h-0.5 bg-gray-400 rounded mb-0.5"></div>
                <div class="flex flex-col gap-0.5 flex-grow justify-around">
                    <div class="w-full flex-1 bg-gray-200 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-200 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-200 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-200 rounded-xs"></div>
                </div>
                <div class="w-full h-0.5 bg-gray-400 rounded mt-0.5"></div>
            </div>
        `;
    } else if (frame.id === 'korean_black_4') {
        return `
            <div class="rounded-lg overflow-hidden bg-[#111116] p-1 flex flex-col justify-between border border-gray-700 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="w-full h-0.5 bg-gray-600 rounded mb-0.5"></div>
                <div class="flex flex-col gap-0.5 flex-grow justify-around">
                    <div class="w-full flex-1 bg-gray-800 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-800 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-800 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-800 rounded-xs"></div>
                </div>
                <div class="w-full h-0.5 bg-gray-600 rounded mt-0.5"></div>
            </div>
        `;
    } else if (frame.id === 'receipt_4') {
        return `
            <div class="rounded-lg overflow-hidden bg-white p-1 flex flex-col justify-between border border-gray-300 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="w-full h-1 bg-black rounded-xs mb-0.5"></div>
                <div class="grid grid-cols-2 gap-0.5 flex-grow my-0.5">
                    <div class="bg-gray-300 rounded-xs"></div>
                    <div class="bg-gray-300 rounded-xs"></div>
                    <div class="bg-gray-300 rounded-xs"></div>
                    <div class="bg-gray-300 rounded-xs"></div>
                </div>
                <div class="w-full h-1 bg-black rounded-xs mt-0.5"></div>
            </div>
        `;
    } else if (frame.id === 'cinema_red_3') {
        return `
            <div class="rounded-lg overflow-hidden bg-[#991b1b] p-1 flex flex-col justify-between border border-red-950 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="text-[5px] font-black text-white text-center leading-none">FILM</div>
                <div class="flex flex-col gap-0.5 flex-grow justify-around my-0.5">
                    <div class="w-full flex-1 bg-white rounded-xs"></div>
                    <div class="w-full flex-1 bg-white rounded-xs"></div>
                    <div class="w-full flex-1 bg-white rounded-xs"></div>
                </div>
                <div class="w-full h-0.5 bg-red-950 rounded"></div>
            </div>
        `;
    } else if (frame.id === 'blue_grid_4') {
        return `
            <div class="rounded-lg overflow-hidden bg-[#1e3a8a] p-1 flex flex-col justify-between border border-blue-900 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="grid grid-cols-2 gap-0.5 flex-grow mb-0.5">
                    <div class="bg-blue-200/90 rounded-xs"></div>
                    <div class="bg-blue-200/90 rounded-xs"></div>
                    <div class="bg-blue-200/90 rounded-xs"></div>
                    <div class="bg-blue-200/90 rounded-xs"></div>
                </div>
                <div class="text-[5px] font-bold text-blue-200 text-center uppercase leading-none">GRID</div>
            </div>
        `;
    } else if (frame.id === 'pastel_y2k_4') {
        return `
            <div class="rounded-lg overflow-hidden bg-gradient-to-b from-[#ffcbf2] via-[#e2afff] to-[#c8e7ff] p-1 flex flex-col justify-between border border-pink-300 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="text-[5px] font-black text-pink-700 text-center leading-none">&star; Y2K &star;</div>
                <div class="flex flex-col gap-0.5 flex-grow justify-around my-0.5">
                    <div class="w-full flex-1 bg-white/80 rounded-xs"></div>
                    <div class="w-full flex-1 bg-white/80 rounded-xs"></div>
                    <div class="w-full flex-1 bg-white/80 rounded-xs"></div>
                    <div class="w-full flex-1 bg-white/80 rounded-xs"></div>
                </div>
                <div class="w-full h-0.5 bg-pink-400 rounded"></div>
            </div>
        `;
    } else if (frame.id === 'film_strip_5') {
        return `
            <div class="rounded-lg overflow-hidden bg-[#18181b] p-1 flex flex-col justify-between border border-gray-700 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="w-full h-0.5 bg-gray-500 rounded mb-0.5"></div>
                <div class="flex flex-col gap-0.5 flex-grow justify-around">
                    <div class="w-full flex-1 bg-gray-700 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-700 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-700 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-700 rounded-xs"></div>
                    <div class="w-full flex-1 bg-gray-700 rounded-xs"></div>
                </div>
                <div class="w-full h-0.5 bg-gray-500 rounded mt-0.5"></div>
            </div>
        `;
    } else if (frame.id === 'polaroid_trio_3') {
        return `
            <div class="rounded-lg overflow-hidden bg-[#f8f6f0] p-1 flex flex-col justify-between border border-gray-300 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
                <div class="flex flex-col gap-0.5 flex-grow justify-around">
                    <div class="w-full flex-1 bg-white p-0.5 pb-1 rounded-2xs border border-gray-200 flex flex-col"><div class="w-full flex-grow bg-gray-200"></div></div>
                    <div class="w-full flex-1 bg-white p-0.5 pb-1 rounded-2xs border border-gray-200 flex flex-col"><div class="w-full flex-grow bg-gray-200"></div></div>
                    <div class="w-full flex-1 bg-white p-0.5 pb-1 rounded-2xs border border-gray-200 flex flex-col"><div class="w-full flex-grow bg-gray-200"></div></div>
                </div>
                <div class="text-[5px] text-gray-500 text-center font-handwriting leading-none">love</div>
            </div>
        `;
    }

    return `
        <div class="rounded-lg overflow-hidden bg-gray-800 p-1 flex flex-col justify-center items-center border border-gray-700 shadow-md shrink-0" style="width: ${w}px; height: ${h}px;">
            <span class="text-[9px] font-black text-gray-300">${frame.slotCount}P</span>
        </div>
    `;
}

// ================= RENDER FRAMES LIST IN SIDEBAR =================
function renderFramesListUI() {
    const frameList = document.getElementById('frameList');
    if (!frameList) return;
    frameList.innerHTML = '';

    let filteredList = [...frames];
    if (currentFrameCategoryFilter === '4') {
        filteredList = filteredList.filter(f => f.slotCount === 4);
    } else if (currentFrameCategoryFilter === '3') {
        filteredList = filteredList.filter(f => f.slotCount === 3);
    } else if (currentFrameCategoryFilter === '5') {
        filteredList = filteredList.filter(f => f.slotCount === 5);
    } else if (currentFrameCategoryFilter === 'custom') {
        filteredList = filteredList.filter(f => f.isCustom);
    }

    if (filteredList.length === 0) {
        frameList.innerHTML = `
            <div class="text-center py-12 px-4 border border-dashed border-gray-800 rounded-3xl bg-[#141420]/60">
                <i class="ph ph-frame-corners text-3xl text-gray-600 mb-2"></i>
                <p class="text-xs text-gray-300 font-bold mb-1">Tidak ada template di kategori ini</p>
                <p class="text-[11px] text-gray-500 mb-4">Gunakan "+ Upload Frame" atau ubah filter.</p>
                <button onclick="document.querySelector('.cat-pill[data-cat=all]').click()" class="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-xl text-xs font-bold transition">
                    Lihat Semua Frame
                </button>
            </div>
        `;
        return;
    }

    filteredList.forEach((frame) => {
        const isSelected = currentSelectedFrame && currentSelectedFrame.id === frame.id;
        const card = document.createElement('div');
        card.className = `frame-item-card cursor-pointer rounded-2xl p-3 bg-[#161624] transition-all flex items-center gap-3 relative group ${isSelected ? 'is-active' : ''}`;
        card.dataset.frameId = frame.id;
        
        const miniPreviewHtml = generateMiniFramePreviewHtml(frame);
        
        card.innerHTML = `
            ${miniPreviewHtml}
            <div class="flex-grow min-w-0 pr-6">
                <h4 class="text-xs font-black text-white truncate mb-1">${frame.name}</h4>
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                        ${frame.slotCount} Pose
                    </span>
                    <span class="text-[9px] bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded font-mono">
                        ${frame.width}&times;${frame.height}
                    </span>
                    ${frame.isCustom ? '<span class="text-[8px] bg-purple-900/60 text-purple-300 border border-purple-600/40 px-1.5 py-0.5 rounded font-black">CUSTOM</span>' : ''}
                </div>
            </div>
            <div class="active-badge absolute top-2.5 right-2.5 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg items-center gap-1 ${isSelected ? 'flex' : 'hidden'}">
                <i class="ph ph-check-bold text-[10px]"></i> AKTIF
            </div>
            <button class="btn-del-frame absolute bottom-2.5 right-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white w-6 h-6 rounded-lg flex items-center justify-center transition opacity-0 group-hover:opacity-100 border border-red-500/30 shadow">
                <i class="ph ph-trash text-xs"></i>
            </button>
        `;

        card.querySelector('.btn-del-frame').onclick = (e) => {
            e.stopPropagation();
            deleteFrameById(frame.id);
        };

        card.onclick = () => selectFrame(frame);
        frameList.appendChild(card);
    });
}

async function deleteFrameById(frameId) {
    if (!confirm("Hapus template frame ini dari daftar photobooth?")) return;
    frames = frames.filter(f => f.id !== frameId);
    await FrameDB.deleteFrame(frameId);
    renderFramesListUI();
    renderFrameManagerGrid();
    if (currentSelectedFrame && currentSelectedFrame.id === frameId) {
        if (frames.length > 0) {
            selectFrame(frames[0]);
        } else {
            const editor = document.getElementById('frameEditor');
            if (editor) editor.innerHTML = '';
            currentSelectedFrame = null;
        }
    }
}

// ================= FRAME MANAGER MODAL LOGIC =================
function renderFrameManagerGrid() {
    const frameManagerGrid = document.getElementById('frameManagerGrid');
    const mgrFrameCountText = document.getElementById('mgrFrameCountText');
    if (!frameManagerGrid) return;

    frameManagerGrid.innerHTML = '';
    if (mgrFrameCountText) mgrFrameCountText.innerText = frames.length;

    if (frames.length === 0) {
        frameManagerGrid.innerHTML = `
            <div class="col-span-full text-center py-10 text-gray-400">
                <i class="ph ph-warning-circle text-3xl mb-2 text-yellow-500"></i>
                <p class="text-sm font-bold text-white">Tidak ada frame yang aktif.</p>
                <p class="text-xs text-gray-400 mt-1">Klik "+ Upload Frame Baru" atau "Reset ke Bawaan" untuk menambahkan frame.</p>
            </div>
        `;
        return;
    }

    frames.forEach((frame) => {
        const card = document.createElement('div');
        card.className = 'bg-[#181826] p-3.5 rounded-2xl border border-gray-800 flex flex-col justify-between shadow-lg relative group';

        const pWidth = 40;
        const pHeight = Math.min(54, Math.max(28, Math.round(40 / (frame.width / frame.height))));

        card.innerHTML = `
            <div class="flex items-start justify-between gap-3 mb-3">
                <div class="flex items-center gap-3">
                    <div class="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700 overflow-hidden shrink-0 shadow-inner" style="width: ${pWidth}px; height: ${pHeight}px;">
                        <span class="text-[9px] text-gray-400 font-bold">${frame.slotCount}P</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-white line-clamp-1">${frame.name}</h4>
                        <div class="text-[10px] text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
                            <span>${frame.width}&times;${frame.height}px</span> &bull; 
                            <span>${frame.slotCount} Slots</span>
                        </div>
                    </div>
                </div>
                <span class="text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${frame.isCustom ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50' : 'bg-gray-800 text-gray-400'}">
                    ${frame.isCustom ? 'CUSTOM' : 'BUILT-IN'}
                </span>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gray-800/80 mt-1">
                <button class="btn-use-mgr text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
                    <i class="ph ph-check-circle"></i> Gunakan Ini
                </button>
                <button class="btn-delete-mgr text-[11px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition">
                    <i class="ph ph-trash"></i> Hapus
                </button>
            </div>
        `;

        card.querySelector('.btn-use-mgr').onclick = () => {
            const frameManagerModal = document.getElementById('frameManagerModal');
            if (frameManagerModal) frameManagerModal.classList.add('hide');
            renderFramesListUI();
            selectFrame(frame);
        };

        card.querySelector('.btn-delete-mgr').onclick = () => {
            deleteFrameById(frame.id);
        };

        frameManagerGrid.appendChild(card);
    });
}

function initFrameManagerEvents() {
    const frameManagerModal = document.getElementById('frameManagerModal');
    const btnOpenFrameManager = document.getElementById('btnOpenFrameManager');
    const btnCloseFrameManager = document.getElementById('btnCloseFrameManager');
    const btnDoneFrameManager = document.getElementById('btnDoneFrameManager');
    const btnExportPreset = document.getElementById('btnExportPreset');
    const btnImportPresetTrigger = document.getElementById('btnImportPresetTrigger');
    const importPresetFileInput = document.getElementById('importPresetFileInput');
    const btnResetToDefaults = document.getElementById('btnResetToDefaults');

    if (btnOpenFrameManager) {
        btnOpenFrameManager.onclick = () => {
            renderFrameManagerGrid();
            if (frameManagerModal) frameManagerModal.classList.remove('hide');
        };
    }

    if (btnCloseFrameManager && frameManagerModal) {
        btnCloseFrameManager.onclick = () => frameManagerModal.classList.add('hide');
    }

    if (btnDoneFrameManager && frameManagerModal) {
        btnDoneFrameManager.onclick = () => {
            frameManagerModal.classList.add('hide');
            renderFramesListUI();
            if (frames.length > 0 && (!currentSelectedFrame || !frames.find(f => f.id === currentSelectedFrame.id))) {
                selectFrame(frames[0]);
            }
        };
    }

    if (btnExportPreset) {
        btnExportPreset.onclick = () => {
            if (frames.length === 0) {
                alert("Tidak ada template frame untuk diekspor!");
                return;
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(frames, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `photobooth_event_preset_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        };
    }

    if (btnImportPresetTrigger && importPresetFileInput) {
        btnImportPresetTrigger.onclick = () => importPresetFileInput.click();
        importPresetFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (Array.isArray(imported) && imported.length > 0) {
                        const replaceAll = confirm("Apakah Anda ingin mengganti semua frame saat ini dengan preset yang diimpor?\n\n(Klik 'OK' untuk ganti total, atau 'Cancel' untuk menggabungkan frame)");
                        if (replaceAll) {
                            frames = imported;
                        } else {
                            const existingIds = new Set(frames.map(f => f.id));
                            imported.forEach(f => {
                                if (existingIds.has(f.id)) f.id = 'frame_' + Date.now() + '_' + Math.random().toString(36).substring(2,6);
                                frames.push(f);
                            });
                        }
                        await FrameDB.saveAllFrames(frames);
                        renderFrameManagerGrid();
                        renderFramesListUI();
                        if (frames.length > 0) selectFrame(frames[0]);
                        alert(`✨ Berhasil mengimpor ${imported.length} template frame!`);
                    } else {
                        alert("File preset tidak valid.");
                    }
                } catch(err) {
                    console.error("Import preset error:", err);
                    alert("Gagal membaca file preset JSON.");
                }
            };
            reader.readAsText(file);
        };
    }

    if (btnResetToDefaults) {
        btnResetToDefaults.onclick = async () => {
            if (!confirm("Kembalikan semua template frame ke template bawaan semula?")) return;
            frames = [...builtInFrames];
            await FrameDB.saveAllFrames(frames);
            renderFrameManagerGrid();
            renderFramesListUI();
            if (frames.length > 0) selectFrame(frames[0]);
            alert("Template frame telah dikembalikan ke bawaan semula.");
        };
    }

    // Category pills filter
    document.querySelectorAll('.cat-pill').forEach(pill => {
        pill.onclick = () => {
            document.querySelectorAll('.cat-pill').forEach(p => {
                p.classList.remove('bg-blue-600', 'text-white', 'active');
                p.classList.add('bg-gray-800/80', 'text-gray-400');
            });
            pill.classList.add('bg-blue-600', 'text-white', 'active');
            pill.classList.remove('bg-gray-800/80', 'text-gray-400');
            currentFrameCategoryFilter = pill.dataset.cat;
            renderFramesListUI();
        };
    });
}
