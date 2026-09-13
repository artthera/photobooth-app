/**
 * Photobooth Pro - Theme & Custom Appearance Controller
 * Fitur: Mengelola teks kustom, background wallpaper, font typography, warna aksen, dan export/import preset tema.
 */

const ThemeManager = (function() {
    const STORAGE_KEY = 'eazy_fotobooth_theme_v3';
    
    const defaults = {
        brandName: "EAZY FOTOBOOTH",
        brandBadge: "HD PHOTO & LIVE MOTION",
        landingBadge: "KOREAN STYLE PHOTOBOOTH",
        landingTitle: "EAZY FOTOBOOTH",
        landingSubtitle: "Abadikan setiap pose secara otomatis dengan 3 format hasil: Photo Strip, Motion Video, dan Looping GIF",
        landingBtnText: "TAP TO START",
        
        guideBadge: "Panduan Singkat",
        guideTitle: "CARA KERJA EAZY FOTOBOOTH",
        guideSubtitle: "3 langkah mudah untuk menghasilkan momen terbaik Anda",
        guideBtnText: "MENGERTI, AYO MULAI",
        
        resultsBadge: "HASIL SIAP DI-DOWNLOAD",
        resultsTitle: "YOUR PHOTOBOOTH MOMENTS",
        resultsSubtitle: "Semua foto, video live motion, dan animasi GIF berhasil dibuat dengan kualitas tinggi!",
        
        bgMode: "gradient", // 'camera' | 'gradient' | 'color' | 'image'
        bgGradient: "linear-gradient(135deg, #f8fafc 0%, #eef2f6 50%, #ffffff 100%)",
        bgColor: "#ffffff",
        bgImageData: null,
        bgImageName: "custom_wallpaper.jpg",
        bgOverlayOpacity: 5,
        bgBlur: 0,
        
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        accentColor: "#2563eb",
        accentColorEnd: "#7c3aed",

        cloudinaryName: "",
        cloudinaryPreset: "",
        cloudinaryAutoUpload: true,
        cloudinaryEventName: "",
    };

    let currentConfig = { ...defaults };
    let activeWorkingConfig = { ...defaults };

    function loadConfig() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                currentConfig = { ...defaults, ...parsed };
            } else {
                currentConfig = { ...defaults };
            }
        } catch(e) {
            console.error("Load theme config error:", e);
            currentConfig = { ...defaults };
        }
        activeWorkingConfig = { ...currentConfig };
        return currentConfig;
    }

    function saveConfig(cfg) {
        try {
            currentConfig = { ...cfg };
            activeWorkingConfig = { ...currentConfig };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
            return true;
        } catch(e) {
            console.error("Save theme config error:", e);
            return false;
        }
    }

    function applyConfig(cfg) {
        if (!cfg) return;

        // 1. Text Elements
        const elBrandTitle = document.getElementById('brandHeaderTitle');
        if (elBrandTitle) elBrandTitle.textContent = cfg.brandName || defaults.brandName;

        const elBrandBadge = document.getElementById('brandHeaderBadge');
        if (elBrandBadge) {
            elBrandBadge.innerHTML = `<i class="ph ph-sparkle text-amber-500"></i> ${cfg.brandBadge || defaults.brandBadge}`;
        }

        const elLandingBadgeText = document.getElementById('landingBadgeText');
        if (elLandingBadgeText) elLandingBadgeText.textContent = cfg.landingBadge || defaults.landingBadge;

        const elLandingTitle = document.getElementById('landingMainTitle');
        if (elLandingTitle) elLandingTitle.textContent = cfg.landingTitle || defaults.landingTitle;

        const elLandingSubtitle = document.getElementById('landingSubtitle');
        if (elLandingSubtitle) {
            if (cfg.landingSubtitle) {
                elLandingSubtitle.innerHTML = cfg.landingSubtitle.replace(/\n/g, '<br/>');
            } else {
                elLandingSubtitle.textContent = defaults.landingSubtitle;
            }
        }

        const elBtnLandingText = document.getElementById('btnLandingText');
        if (elBtnLandingText) elBtnLandingText.textContent = cfg.landingBtnText || defaults.landingBtnText;

        const elGuideBadge = document.getElementById('guideBadge');
        if (elGuideBadge) elGuideBadge.textContent = cfg.guideBadge || defaults.guideBadge;

        const elGuideTitle = document.getElementById('guideTitle');
        if (elGuideTitle) elGuideTitle.textContent = cfg.guideTitle || defaults.guideTitle;

        const elGuideSubtitle = document.getElementById('guideSubtitle');
        if (elGuideSubtitle) elGuideSubtitle.textContent = cfg.guideSubtitle || defaults.guideSubtitle;

        const elBtnStartCaptureText = document.getElementById('btnStartCaptureText');
        if (elBtnStartCaptureText) elBtnStartCaptureText.textContent = cfg.guideBtnText || defaults.guideBtnText;

        const elResultsBadgeText = document.getElementById('resultsBadgeText');
        if (elResultsBadgeText) elResultsBadgeText.textContent = cfg.resultsBadge || defaults.resultsBadge;

        const elResultsTitle = document.getElementById('resultsTitle');
        if (elResultsTitle) elResultsTitle.textContent = cfg.resultsTitle || defaults.resultsTitle;

        const elResultsSubtitle = document.getElementById('resultsSubtitle');
        if (elResultsSubtitle) elResultsSubtitle.textContent = cfg.resultsSubtitle || defaults.resultsSubtitle;

        // 2. Typography & Fonts
        const font = cfg.fontFamily || defaults.fontFamily;
        document.documentElement.style.setProperty('--app-font', font);
        document.body.style.fontFamily = font;

        // 3. Accent Color
        const accent = cfg.accentColor || defaults.accentColor;
        document.documentElement.style.setProperty('--accent-primary', accent);

        // 4. Background Layers
        const cameraContainer = document.getElementById('cameraContainer');
        const customBgImageLayer = document.getElementById('customBgImageLayer');
        const customBgColorLayer = document.getElementById('customBgColorLayer');
        const globalBgOverlay = document.getElementById('globalBgOverlay');
        const stateCamera = document.getElementById('state-camera');

        const isCurrentlyInCamera = stateCamera && !stateCamera.classList.contains('hide');

        if (cameraContainer) {
            cameraContainer.style.display = (isCurrentlyInCamera || cfg.bgMode === 'camera') ? 'block' : 'none';
        }

        if (customBgImageLayer) {
            if (!isCurrentlyInCamera && cfg.bgMode === 'image' && cfg.bgImageData) {
                customBgImageLayer.style.backgroundImage = `url("${cfg.bgImageData}")`;
                customBgImageLayer.style.opacity = '1';
            } else {
                customBgImageLayer.style.opacity = '0';
            }
        }

        if (customBgColorLayer) {
            if (!isCurrentlyInCamera) {
                if (cfg.bgMode === 'gradient') {
                    customBgColorLayer.style.background = cfg.bgGradient || defaults.bgGradient;
                    customBgColorLayer.style.opacity = '1';
                } else if (cfg.bgMode === 'color') {
                    customBgColorLayer.style.background = cfg.bgColor || defaults.bgColor;
                    customBgColorLayer.style.opacity = '1';
                } else {
                    customBgColorLayer.style.opacity = '0';
                }
            } else {
                customBgColorLayer.style.opacity = '0';
            }
        }

        if (globalBgOverlay) {
            if (!isCurrentlyInCamera) {
                const opacityRatio = (cfg.bgOverlayOpacity !== undefined ? cfg.bgOverlayOpacity : 5) / 100;
                globalBgOverlay.style.backgroundColor = `rgba(0, 0, 0, ${opacityRatio})`;
                const blurPx = cfg.bgBlur || 0;
                globalBgOverlay.style.backdropFilter = `blur(${blurPx}px)`;
                globalBgOverlay.style.webkitBackdropFilter = `blur(${blurPx}px)`;
                globalBgOverlay.style.opacity = '1';
            } else {
                globalBgOverlay.style.opacity = '0';
            }
        }
    }

    function showToast(title, message) {
        const toast = document.getElementById('themeToast');
        const toastTitle = document.getElementById('themeToastTitle');
        const toastMessage = document.getElementById('themeToastMessage');
        if (!toast) return;
        
        if (toastTitle) toastTitle.textContent = title;
        if (toastMessage) toastMessage.textContent = message;
        
        toast.classList.remove('translate-y-[-150%]');
        toast.classList.add('translate-y-0');
        
        setTimeout(() => {
            toast.classList.remove('translate-y-0');
            toast.classList.add('translate-y-[-150%]');
        }, 3000);
    }

    function syncMockup(cfg) {
        const mBadge = document.getElementById('mockupBadge');
        const mTitle = document.getElementById('mockupTitle');
        const mSubtitle = document.getElementById('mockupSubtitle');
        const mBtnText = document.getElementById('mockupBtnText');

        if (mBadge) mBadge.textContent = cfg.landingBadge || defaults.landingBadge;
        if (mTitle) mTitle.textContent = cfg.landingTitle || defaults.landingTitle;
        if (mSubtitle) mSubtitle.textContent = cfg.landingSubtitle || defaults.landingSubtitle;
        if (mBtnText) mBtnText.textContent = cfg.landingBtnText || defaults.landingBtnText;
    }

    function renderDashFrames() {
        const grid = document.getElementById('dashFrameGrid');
        const countBadge = document.getElementById('dashCountFrames');
        if (typeof frames !== 'undefined' && frames) {
            if (countBadge) countBadge.textContent = `${frames.length} Active`;
            if (grid) {
                grid.innerHTML = '';
                frames.forEach(frame => {
                    const card = document.createElement('div');
                    card.className = 'bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs hover:border-blue-400 transition';
                    card.innerHTML = `
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-14 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center justify-center font-bold text-xs text-blue-600">
                                ${frame.slotCount}P
                            </div>
                            <div>
                                <h4 class="text-xs font-black text-slate-800 line-clamp-1">${frame.name}</h4>
                                <div class="text-[10px] text-slate-400 font-medium mt-0.5">${frame.width} &times; ${frame.height}px &bull; ${frame.slotCount} Slots</div>
                            </div>
                        </div>
                        <span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${frame.isCustom ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-200 text-slate-600'}">
                            ${frame.isCustom ? 'Custom' : 'Bawaan'}
                        </span>
                    `;
                    grid.appendChild(card);
                });
            }
        }
    }

    function syncModalInputs(cfg) {
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('themeBrandName', cfg.brandName);
        setVal('themeBrandBadge', cfg.brandBadge);
        setVal('themeLandingBadge', cfg.landingBadge);
        setVal('themeLandingTitle', cfg.landingTitle);
        setVal('themeLandingSubtitle', cfg.landingSubtitle);
        setVal('themeLandingBtnText', cfg.landingBtnText);

        setVal('themeGuideBadge', cfg.guideBadge);
        setVal('themeGuideTitle', cfg.guideTitle);
        setVal('themeGuideSubtitle', cfg.guideSubtitle);
        setVal('themeGuideBtnText', cfg.guideBtnText);

        setVal('themeResultsBadge', cfg.resultsBadge);
        setVal('themeResultsTitle', cfg.resultsTitle);
        setVal('themeResultsSubtitle', cfg.resultsSubtitle);

        // Update Live Mockup Preview
        syncMockup(cfg);

        // Background Mode Buttons
        document.querySelectorAll('.theme-bg-mode-btn').forEach(btn => {
            const mode = btn.getAttribute('data-mode');
            if (mode === cfg.bgMode) {
                btn.classList.add('border-blue-500', 'bg-blue-50', 'text-blue-700');
                btn.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
            } else {
                btn.classList.remove('border-blue-500', 'bg-blue-50', 'text-blue-700');
                btn.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
            }
        });

        // Toggle sub options panels
        const gradOptions = document.getElementById('themeGradientOptions');
        const colorOptions = document.getElementById('themeColorOptions');
        const imageOptions = document.getElementById('themeImageOptions');

        if (gradOptions) gradOptions.classList.toggle('hide', cfg.bgMode !== 'gradient');
        if (colorOptions) colorOptions.classList.toggle('hide', cfg.bgMode !== 'color');
        if (imageOptions) imageOptions.classList.toggle('hide', cfg.bgMode !== 'image');

        // Gradient card highlights
        document.querySelectorAll('.theme-grad-card').forEach(card => {
            const grad = card.getAttribute('data-gradient');
            if (grad === cfg.bgGradient) {
                card.classList.add('ring-2', 'ring-blue-600', 'border-blue-600');
            } else {
                card.classList.remove('ring-2', 'ring-blue-600', 'border-blue-600');
            }
        });

        // Color input
        setVal('themeBgColorInput', cfg.bgColor);
        const colorHex = document.getElementById('themeBgColorHex');
        if (colorHex) colorHex.textContent = cfg.bgColor || '#ffffff';

        // Image preview
        const imgPrevWrapper = document.getElementById('themeBgImagePreviewWrapper');
        const imgThumb = document.getElementById('themeBgImageThumbnail');
        const imgName = document.getElementById('themeBgImageName');
        if (imgPrevWrapper && imgThumb) {
            if (cfg.bgImageData) {
                imgThumb.src = cfg.bgImageData;
                if (imgName) imgName.textContent = cfg.bgImageName || "custom_wallpaper.jpg";
                imgPrevWrapper.classList.remove('hide');
            } else {
                imgPrevWrapper.classList.add('hide');
            }
        }

        // Range sliders
        const sliderOpacity = document.getElementById('themeOverlayOpacity');
        const valOpacity = document.getElementById('themeOverlayOpacityVal');
        if (sliderOpacity && valOpacity) {
            sliderOpacity.value = cfg.bgOverlayOpacity !== undefined ? cfg.bgOverlayOpacity : 5;
            valOpacity.textContent = `${sliderOpacity.value}%`;
        }

        const sliderBlur = document.getElementById('themeBgBlur');
        const valBlur = document.getElementById('themeBgBlurVal');
        if (sliderBlur && valBlur) {
            sliderBlur.value = cfg.bgBlur !== undefined ? cfg.bgBlur : 0;
            valBlur.textContent = `${sliderBlur.value}px`;
        }

        // Font cards
        document.querySelectorAll('.theme-font-card').forEach(card => {
            const font = card.getAttribute('data-font');
            if (font === cfg.fontFamily) {
                card.classList.add('border-blue-500', 'bg-blue-50');
                card.classList.remove('border-slate-200', 'bg-white');
            } else {
                card.classList.remove('border-blue-500', 'bg-blue-50');
                card.classList.add('border-slate-200', 'bg-white');
            }
        });

        // Accent color buttons
        document.querySelectorAll('.theme-accent-btn').forEach(btn => {
            const color = btn.getAttribute('data-color');
            if (color === cfg.accentColor) {
                btn.classList.add('border-blue-500', 'bg-blue-50');
                btn.classList.remove('border-slate-200', 'bg-white');
            } else {
                btn.classList.remove('border-blue-500', 'bg-blue-50');
                btn.classList.add('border-slate-200', 'bg-white');
            }
        });

        // Cloudinary Storage inputs
        setVal('themeCloudinaryName', cfg.cloudinaryName || '');
        setVal('themeCloudinaryPreset', cfg.cloudinaryPreset || '');
        if (document.getElementById('themeCloudinaryAutoUpload')) {
            document.getElementById('themeCloudinaryAutoUpload').checked = cfg.cloudinaryAutoUpload !== false;
        }
        setVal('themeCloudinaryEventName', cfg.cloudinaryEventName || '');
        const statusCloudinary = document.getElementById('cloudinaryTestStatus');
        if (statusCloudinary) statusCloudinary.classList.add('hidden');
    }

    function initModalUI() {
        const btnSave = document.getElementById('btnSaveThemeSettings');

        // Sidebar Navigation Handling (.dash-nav-btn & [data-target])
        const navBtns = document.querySelectorAll('.dash-nav-btn');
        const sections = document.querySelectorAll('.dash-section');

        function switchDashSection(targetId) {
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.remove('hide');
                } else {
                    sec.classList.add('hide');
                }
            });

            navBtns.forEach(btn => {
                if (btn.getAttribute('data-target') === targetId) {
                    btn.classList.add('bg-blue-600', 'text-white', 'shadow-xs');
                    btn.classList.remove('text-slate-600', 'hover:bg-slate-100');
                } else {
                    btn.classList.remove('bg-blue-600', 'text-white', 'shadow-xs');
                    btn.classList.add('text-slate-600', 'hover:bg-slate-100');
                }
            });

            if (targetId === 'dashSectionFrames') {
                renderDashFrames();
            }
        }

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-target');
                if (target) switchDashSection(target);
            });
        });

        // Horizontal tabs support (fallback)
        const tabBtns = [
            { btn: document.getElementById('themeTabBtnTexts'), content: document.getElementById('themeTabContentTexts') },
            { btn: document.getElementById('themeTabBtnBackground'), content: document.getElementById('themeTabContentBackground') },
            { btn: document.getElementById('themeTabBtnStyle'), content: document.getElementById('themeTabContentStyle') },
            { btn: document.getElementById('themeTabBtnOther'), content: document.getElementById('themeTabContentOther') },
            { btn: document.getElementById('themeTabBtnGdrive'), content: document.getElementById('themeTabContentGdrive') }
        ];

        function switchTab(targetBtnId) {
            tabBtns.forEach(t => {
                if (!t.btn || !t.content) return;
                if (t.btn.id === targetBtnId) {
                    t.btn.classList.add('bg-blue-600', 'text-white');
                    t.btn.classList.remove('bg-slate-100', 'text-slate-600');
                    t.content.classList.remove('hide');
                } else {
                    t.btn.classList.remove('bg-blue-600', 'text-white');
                    t.btn.classList.add('bg-slate-100', 'text-slate-600');
                    t.content.classList.add('hide');
                }
            });
        }

        tabBtns.forEach(({ btn }) => {
            if (!btn) return;
            btn.addEventListener('click', () => switchTab(btn.id));
        });

        // Setup from results screen
        const btnSetupGdriveResults = document.getElementById('btnSetupGdriveResults');
        if (btnSetupGdriveResults) {
            btnSetupGdriveResults.addEventListener('click', () => {
                ['state-landing', 'state-instructions', 'state-camera', 'state-builder', 'state-results'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hide');
                });
                const stateAdmin = document.getElementById('state-admin');
                if (stateAdmin) stateAdmin.classList.remove('hide');
                syncModalInputs(currentConfig);
                switchDashSection('dashSectionGdrive');
                switchTab('themeTabBtnGdrive');
            });
        }

        // Admin Header & Dashboard Buttons: Kelola Frame Event & Studio Frame Custom
        const btnAdminFrame = document.getElementById('btnAdminOpenFrameManager');
        if (btnAdminFrame) {
            btnAdminFrame.addEventListener('click', () => {
                if (typeof renderFrameManagerGrid === 'function') renderFrameManagerGrid();
                const modal = document.getElementById('frameManagerModal');
                if (modal) modal.classList.remove('hide');
            });
        }

        const btnDashFramesManage = document.getElementById('btnDashManageAllFrames');
        if (btnDashFramesManage) {
            btnDashFramesManage.addEventListener('click', () => {
                if (typeof renderFrameManagerGrid === 'function') renderFrameManagerGrid();
                const modal = document.getElementById('frameManagerModal');
                if (modal) modal.classList.remove('hide');
            });
        }

        const openCustomModalHandler = () => {
            const customFrameModal = document.getElementById('customFrameModal');
            if (customFrameModal) customFrameModal.classList.remove('hide');
            if (typeof customOriginalDataUrl !== 'undefined' && !customOriginalDataUrl) {
                const customUploadDropZone = document.getElementById('customUploadDropZone');
                if (customUploadDropZone) customUploadDropZone.classList.remove('hide');
                const customEditorStageWrapper = document.getElementById('customEditorStageWrapper');
                if (customEditorStageWrapper) customEditorStageWrapper.classList.add('hide');
            } else if (typeof adjustCustomStageScale === 'function') {
                setTimeout(adjustCustomStageScale, 50);
            }
        };

        const btnAdminStudio = document.getElementById('btnAdminOpenCustomStudio');
        if (btnAdminStudio) btnAdminStudio.addEventListener('click', openCustomModalHandler);

        const btnDashStudio = document.getElementById('btnDashOpenCustomStudio');
        if (btnDashStudio) btnDashStudio.addEventListener('click', openCustomModalHandler);

        const btnOpenFullModal = document.getElementById('btnOpenFullCustomModal');
        if (btnOpenFullModal) btnOpenFullModal.addEventListener('click', openCustomModalHandler);

        const dashCustomFileInput = document.getElementById('dashCustomFileInput');
        if (dashCustomFileInput) {
            dashCustomFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    openCustomModalHandler();
                    if (typeof handleCustomFrameFile === 'function') {
                        handleCustomFrameFile(file);
                    }
                }
            });
        }

        // Cloudinary Test Connection Button
        const btnTestCloudinary = document.getElementById('btnTestCloudinary');
        const cloudinaryTestStatus = document.getElementById('cloudinaryTestStatus');
        if (btnTestCloudinary && cloudinaryTestStatus) {
            btnTestCloudinary.addEventListener('click', async () => {
                const cName = (document.getElementById('themeCloudinaryName').value || '').trim();
                const cPreset = (document.getElementById('themeCloudinaryPreset').value || '').trim();
                
                if (!cName || !cPreset) {
                    cloudinaryTestStatus.innerHTML = '<span class="text-amber-600 font-bold"><i class="ph ph-warning"></i> Harap masukkan Cloud Name dan Upload Preset terlebih dahulu!</span>';
                    cloudinaryTestStatus.classList.remove('hidden');
                    return;
                }

                btnTestCloudinary.disabled = true;
                const origBtn = btnTestCloudinary.innerHTML;
                btnTestCloudinary.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Test...';
                cloudinaryTestStatus.innerHTML = '<span class="text-blue-600 font-bold"><i class="ph ph-spinner animate-spin"></i> Menghubungi Cloudinary...</span>';
                cloudinaryTestStatus.classList.remove('hidden');

                try {
                    // Coba upload file teks kosong sebagai pengujian
                    const formData = new FormData();
                    formData.append('file', new Blob(['test'], { type: 'text/plain' }));
                    formData.append('upload_preset', cPreset);

                    const res = await fetch(`https://api.cloudinary.com/v1_1/${cName}/raw/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const data = await res.json();
                    
                    if (data.secure_url) {
                        cloudinaryTestStatus.innerHTML = '<span class="text-emerald-600 font-bold"><i class="ph ph-check-circle"></i> Koneksi Berhasil! Cloudinary siap digunakan.</span>';
                    } else if (data.error) {
                        cloudinaryTestStatus.innerHTML = `<span class="text-red-600 font-bold"><i class="ph ph-warning"></i> Gagal: ${data.error.message}</span>`;
                    } else {
                        cloudinaryTestStatus.innerHTML = '<span class="text-red-600 font-bold"><i class="ph ph-warning"></i> Gagal terhubung ke Cloudinary.</span>';
                    }
                } catch (err) {
                    console.error(err);
                    cloudinaryTestStatus.innerHTML = '<span class="text-red-600 font-bold"><i class="ph ph-warning"></i> Gagal terhubung: ' + err.message + '</span>';
                } finally {
                    btnTestCloudinary.disabled = false;
                    btnTestCloudinary.innerHTML = origBtn;
                }
            });
        }

        // Cloudinary Auto-upload checkbox
        const cbCloudinaryAuto = document.getElementById('themeCloudinaryAutoUpload');
        if (cbCloudinaryAuto) {
            cbCloudinaryAuto.addEventListener('change', (e) => {
                activeWorkingConfig.cloudinaryAutoUpload = e.target.checked;
                applyConfig(activeWorkingConfig);
            });
        }

        // Live Input Bindings for instant real-time feedback & Mockup preview
        const bindInput = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                activeWorkingConfig[key] = e.target.value;
                applyConfig(activeWorkingConfig);
                syncMockup(activeWorkingConfig);
            });
        };

        bindInput('themeBrandName', 'brandName');
        bindInput('themeBrandBadge', 'brandBadge');
        bindInput('themeLandingBadge', 'landingBadge');
        bindInput('themeLandingTitle', 'landingTitle');
        bindInput('themeLandingSubtitle', 'landingSubtitle');
        bindInput('themeLandingBtnText', 'landingBtnText');

        bindInput('themeGuideBadge', 'guideBadge');
        bindInput('themeGuideTitle', 'guideTitle');
        bindInput('themeGuideSubtitle', 'guideSubtitle');
        bindInput('themeGuideBtnText', 'guideBtnText');

        bindInput('themeResultsBadge', 'resultsBadge');
        bindInput('themeResultsTitle', 'resultsTitle');
        bindInput('themeResultsSubtitle', 'resultsSubtitle');
        bindInput('themeCloudinaryName', 'cloudinaryName');
        bindInput('themeCloudinaryPreset', 'cloudinaryPreset');
        bindInput('themeCloudinaryEventName', 'cloudinaryEventName');

        // Background Mode buttons
        document.querySelectorAll('.theme-bg-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                activeWorkingConfig.bgMode = mode;
                syncModalInputs(activeWorkingConfig);
                applyConfig(activeWorkingConfig);
            });
        });

        // Gradient Preset Cards
        document.querySelectorAll('.theme-grad-card').forEach(card => {
            card.addEventListener('click', () => {
                const grad = card.getAttribute('data-gradient');
                activeWorkingConfig.bgGradient = grad;
                syncModalInputs(activeWorkingConfig);
                applyConfig(activeWorkingConfig);
            });
        });

        // Solid Color Input
        const colorInput = document.getElementById('themeBgColorInput');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
                activeWorkingConfig.bgColor = e.target.value;
                const hex = document.getElementById('themeBgColorHex');
                if (hex) hex.textContent = e.target.value;
                applyConfig(activeWorkingConfig);
            });
        }

        // File input for background image
        const fileInput = document.getElementById('themeBgFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        activeWorkingConfig.bgImageData = re.target.result;
                        activeWorkingConfig.bgImageName = file.name;
                        activeWorkingConfig.bgMode = 'image';
                        syncModalInputs(activeWorkingConfig);
                        applyConfig(activeWorkingConfig);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Remove background image button
        const btnRemoveBg = document.getElementById('btnRemoveBgImage');
        if (btnRemoveBg) {
            btnRemoveBg.addEventListener('click', () => {
                activeWorkingConfig.bgImageData = null;
                if (activeWorkingConfig.bgMode === 'image') activeWorkingConfig.bgMode = 'gradient';
                syncModalInputs(activeWorkingConfig);
                applyConfig(activeWorkingConfig);
            });
        }

        // Range Sliders
        const sliderOpacity = document.getElementById('themeOverlayOpacity');
        if (sliderOpacity) {
            sliderOpacity.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                activeWorkingConfig.bgOverlayOpacity = val;
                const label = document.getElementById('themeOverlayOpacityVal');
                if (label) label.textContent = `${val}%`;
                applyConfig(activeWorkingConfig);
            });
        }

        const sliderBlur = document.getElementById('themeBgBlur');
        if (sliderBlur) {
            sliderBlur.addEventListener('input', (e) => {
                const val = parseInt(e.target.value, 10);
                activeWorkingConfig.bgBlur = val;
                const label = document.getElementById('themeBgBlurVal');
                if (label) label.textContent = `${val}px`;
                applyConfig(activeWorkingConfig);
            });
        }

        // Font Family Cards
        document.querySelectorAll('.theme-font-card').forEach(card => {
            card.addEventListener('click', () => {
                const font = card.getAttribute('data-font');
                activeWorkingConfig.fontFamily = font;
                syncModalInputs(activeWorkingConfig);
                applyConfig(activeWorkingConfig);
            });
        });

        // Accent Color Buttons
        document.querySelectorAll('.theme-accent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.getAttribute('data-color');
                const end = btn.getAttribute('data-end');
                activeWorkingConfig.accentColor = color;
                activeWorkingConfig.accentColorEnd = end;
                syncModalInputs(activeWorkingConfig);
                applyConfig(activeWorkingConfig);
            });
        });

        // Save Buttons (all .btn-save-dash & #btnSaveThemeSettings)
        const saveAction = () => {
            saveConfig(activeWorkingConfig);
            applyConfig(currentConfig);
            showToast("Pengaturan Disimpan!", "Pengaturan photobooth berhasil disimpan dan diterapkan.");
        };

        if (btnSave) btnSave.addEventListener('click', saveAction);
        document.querySelectorAll('.btn-save-dash').forEach(btn => {
            btn.addEventListener('click', saveAction);
        });

        // Reset Defaults Button
        const btnReset = document.getElementById('btnResetThemeDefaults');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                if (confirm("Kembalikan seluruh teks, background, dan gaya tampilan ke tema cerah default?")) {
                    activeWorkingConfig = { ...defaults };
                    saveConfig(activeWorkingConfig);
                    syncModalInputs(activeWorkingConfig);
                    applyConfig(currentConfig);
                    showToast("Reset Selesai", "Tampilan telah dikembalikan ke pengaturan cerah bawaan.");
                }
            });
        }

        // Export Theme Preset
        const btnExport = document.getElementById('btnExportThemePreset');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const exportData = {
                    version: 3,
                    type: 'eazy_fotobooth_theme_preset',
                    exportedAt: new Date().toISOString(),
                    theme: { ...activeWorkingConfig }
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `eazy_fotobooth_preset_${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                showToast("Export Berhasil", "Preset tema berhasil didownload sebagai file .json");
            });
        }

        // Import Theme Preset
        const importTrigger = document.getElementById('btnImportThemeTrigger');
        const importFileInput = document.getElementById('importThemeFileInput');
        if (importTrigger && importFileInput) {
            importTrigger.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        try {
                            const parsed = JSON.parse(re.target.result);
                            const importedTheme = parsed.theme || parsed;
                            activeWorkingConfig = { ...defaults, ...importedTheme };
                            saveConfig(activeWorkingConfig);
                            syncModalInputs(activeWorkingConfig);
                            applyConfig(currentConfig);
                            showToast("Import Berhasil!", "Preset tema berhasil dimuat dan diterapkan.");
                        } catch(err) {
                            alert("Format file preset tidak valid!");
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        // Initial sync
        syncModalInputs(currentConfig);
        renderDashFrames();
    }

    return {
        loadConfig,
        saveConfig,
        applyConfig,
        initModalUI,
        syncModalInputs,
        renderDashFrames,
        showToast,
        getConfig: () => currentConfig,
        getActiveConfig: () => activeWorkingConfig
    };
})();
