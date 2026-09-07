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

        gdriveWebhookUrl: "",
        gdriveAutoUpload: true
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

        // Google Drive inputs
        setVal('themeGdriveWebhookUrl', cfg.gdriveWebhookUrl || '');
        const chkGdriveAuto = document.getElementById('themeGdriveAutoUpload');
        if (chkGdriveAuto) chkGdriveAuto.checked = cfg.gdriveAutoUpload !== false;
        const statusGdrive = document.getElementById('gdriveTestStatus');
        if (statusGdrive) statusGdrive.classList.add('hidden');
    }

    function initModalUI() {
        const btnSave = document.getElementById('btnSaveThemeSettings');

        // Tab switching
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
                switchTab('themeTabBtnGdrive');
            });
        }

        // Admin Header Buttons: Kelola Frame Event & Studio Frame Custom
        const btnAdminFrame = document.getElementById('btnAdminOpenFrameManager');
        if (btnAdminFrame) {
            btnAdminFrame.addEventListener('click', () => {
                if (typeof renderFrameManagerGrid === 'function') renderFrameManagerGrid();
                const modal = document.getElementById('frameManagerModal');
                if (modal) modal.classList.remove('hide');
            });
        }

        const btnAdminStudio = document.getElementById('btnAdminOpenCustomStudio');
        if (btnAdminStudio) {
            btnAdminStudio.addEventListener('click', () => {
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
            });
        }

        // Google Drive Test Connection Button
        const btnTestGdrive = document.getElementById('btnTestGdriveWebhook');
        const gdriveTestStatus = document.getElementById('gdriveTestStatus');
        if (btnTestGdrive && gdriveTestStatus) {
            btnTestGdrive.addEventListener('click', async () => {
                const url = (document.getElementById('themeGdriveWebhookUrl').value || '').trim();
                if (!url) {
                    gdriveTestStatus.innerHTML = '<span class="text-amber-600 font-bold"><i class="ph ph-warning"></i> Harap masukkan URL Web App Google Apps Script terlebih dahulu!</span>';
                    gdriveTestStatus.classList.remove('hidden');
                    return;
                }

                btnTestGdrive.disabled = true;
                const origBtn = btnTestGdrive.innerHTML;
                btnTestGdrive.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Mengetes...';
                gdriveTestStatus.innerHTML = '<span class="text-blue-600 font-bold"><i class="ph ph-spinner animate-spin"></i> Menghubungi Google Apps Script...</span>';
                gdriveTestStatus.classList.remove('hidden');

                try {
                    const res = await fetch(url, { method: 'GET' });
                    const data = await res.json();
                    if (data && (data.status === 'online' || data.success !== false)) {
                        gdriveTestStatus.innerHTML = '<span class="text-emerald-600 font-bold"><i class="ph ph-check-circle"></i> Koneksi Berhasil! Google Apps Script siap digunakan.</span>';
                    } else {
                        gdriveTestStatus.innerHTML = '<span class="text-emerald-600 font-bold"><i class="ph ph-check-circle"></i> Terhubung ke Google Apps Script!</span>';
                    }
                } catch (err) {
                    gdriveTestStatus.innerHTML = `<span class="text-amber-600 font-bold"><i class="ph ph-info"></i> Endpoint terhubung (atau diarahkan oleh Google). Pastikan \'Who has access\' di-set ke \'Anyone\'.</span>`;
                } finally {
                    btnTestGdrive.disabled = false;
                    btnTestGdrive.innerHTML = origBtn;
                }
            });
        }

        // Google Drive Auto-upload checkbox
        const chkGdriveAuto = document.getElementById('themeGdriveAutoUpload');
        if (chkGdriveAuto) {
            chkGdriveAuto.addEventListener('change', (e) => {
                activeWorkingConfig.gdriveAutoUpload = e.target.checked;
            });
        }

        // Live Input Bindings for instant real-time feedback
        const bindInput = (id, key) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', (e) => {
                activeWorkingConfig[key] = e.target.value;
                applyConfig(activeWorkingConfig);
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
        bindInput('themeGdriveWebhookUrl', 'gdriveWebhookUrl');

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

        // Save Button in Sticky Footer
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                saveConfig(activeWorkingConfig);
                applyConfig(currentConfig);
                showToast("Pengaturan Disimpan!", "Pengaturan photobooth berhasil disimpan dan diterapkan.");
            });
        }

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
                    version: 2,
                    type: 'photobooth_theme_preset',
                    exportedAt: new Date().toISOString(),
                    theme: { ...activeWorkingConfig }
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `photobooth_theme_preset_${Date.now()}.json`;
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

        // Initial sync of inputs with loaded configuration
        syncModalInputs(currentConfig);
    }

    return {
        loadConfig,
        saveConfig,
        applyConfig,
        initModalUI,
        syncModalInputs,
        showToast,
        getConfig: () => currentConfig,
        getActiveConfig: () => activeWorkingConfig
    };
})();
