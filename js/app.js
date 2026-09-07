/**
 * Photobooth Pro - Main Application Controller
 * Fitur: Mengontrol inisialisasi aplikasi, alur navigasi antar-layar, dan integrasi modul.
 */

window.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Theme & Custom Appearance Settings
    ThemeManager.loadConfig();
    ThemeManager.applyConfig(ThemeManager.getConfig());
    ThemeManager.initModalUI();

    // 2. Initialize Frames IndexedDB
    await initFramesDatabase();

    // 3. Initialize Custom Studio, Frame Manager & Export Engine
    initCustomFrameStudioEvents();
    initFrameManagerEvents();
    initExportEngineEvents();

    // 4. Request Camera Stream 1x Saja
    try {
        await initCameraStream();
    } catch (err) { 
        console.warn("Kamera belum aktif atau perlu izin gesture pengguna."); 
    }

    // 5. Bind Main Navigation Flow
    bindAppNavigation();

    // 6. Support direct Kiosk launch from Dashboard (mode=kiosk)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'kiosk') {
        const stateAdmin = document.getElementById('state-admin');
        const stateLanding = document.getElementById('state-landing');
        if (stateAdmin) stateAdmin.classList.add('hide');
        if (stateLanding) {
            stateLanding.classList.remove('hide');
            stateLanding.style.opacity = '1';
        }
    }
});

function bindAppNavigation() {
    const stateAdmin = document.getElementById('state-admin');
    const stateLanding = document.getElementById('state-landing');
    const stateInstructions = document.getElementById('state-instructions');
    const stateCamera = document.getElementById('state-camera');
    const stateBuilder = document.getElementById('state-builder');
    const stateResults = document.getElementById('state-results');
    
    const btnLaunchBooth = document.getElementById('btnLaunchBooth');
    const btnGoToAdmin = document.getElementById('btnGoToAdmin');
    const btnLanding = document.getElementById('btnLanding');
    const btnStartCapture = document.getElementById('btnStartCapture');
    const btnMulaiFoto = document.getElementById('btnMulaiFoto');
    const btnContinue = document.getElementById('btnContinue');
    const btnFlipCamera = document.getElementById('btnFlipCamera');
    const btnRetryCamera = document.getElementById('btnRetryCamera');
    
    const settingsBar = document.getElementById('settingsBar');
    const photoCounter = document.getElementById('photoCounter');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const settingFilter = document.getElementById('settingFilter');
    const video = document.getElementById('kamera');

    const tabFrameBtn = document.getElementById('tabFrameBtn');
    const tabFilterBtn = document.getElementById('tabFilterBtn');
    const frameList = document.getElementById('frameList');
    const filterList = document.getElementById('filterList');

    const mainAppHeader = document.getElementById('mainAppHeader');

    const launchBoothSession = () => {
        ThemeManager.saveConfig(ThemeManager.getActiveConfig());
        ThemeManager.applyConfig(ThemeManager.getConfig());
        
        if (stateAdmin) stateAdmin.classList.add('hide');
        if (mainAppHeader) mainAppHeader.classList.remove('hide');
        if (stateLanding) {
            stateLanding.classList.remove('hide');
            stateLanding.style.opacity = '1';
        }
        if (streamActive) {
            streamActive.getVideoTracks().forEach(track => track.enabled = true);
        }
        ThemeManager.showToast("Photobooth Siap!", "Sesi photobooth pelanggan telah dibuka.");
    };

    // Bind all launch photobooth buttons
    if (btnLaunchBooth) btnLaunchBooth.addEventListener('click', launchBoothSession);
    document.querySelectorAll('.btn-launch-booth-trigger').forEach(btn => {
        btn.addEventListener('click', launchBoothSession);
    });

    // Header Button -> Back to Admin Dashboard Anytime
    if (btnGoToAdmin) {
        btnGoToAdmin.addEventListener('click', () => {
            [stateLanding, stateInstructions, stateCamera, stateBuilder, stateResults].forEach(el => {
                if (el) el.classList.add('hide');
            });
            if (mainAppHeader) mainAppHeader.classList.add('hide');
            if (stateAdmin) stateAdmin.classList.remove('hide');
            ThemeManager.syncModalInputs(ThemeManager.getConfig());
            ThemeManager.renderDashFrames();
        });
    }

    // 1. Landing -> Instructions
    if (btnLanding && stateLanding && stateInstructions) {
        btnLanding.addEventListener('click', () => {
            stateLanding.style.opacity = '0';
            setTimeout(() => { 
                stateLanding.classList.add('hide'); 
                if (mainAppHeader) mainAppHeader.classList.remove('hide');
                stateInstructions.classList.remove('hide'); 
                stateInstructions.style.opacity = '1';
            }, 300); 
        });
    }

    // 2. Instructions -> Camera UI
    if (btnStartCapture && stateInstructions && stateCamera) {
        btnStartCapture.addEventListener('click', () => {
            stateInstructions.style.opacity = '0';
            setTimeout(() => { 
                stateInstructions.classList.add('hide'); 
                if (mainAppHeader) mainAppHeader.classList.add('hide');
                stateCamera.classList.remove('hide'); 
                stateCamera.style.opacity = '1';
                activateCameraView();
            }, 300); 
        });
    }

    // 3. Flip Camera (Front / Back)
    if (btnFlipCamera) {
        btnFlipCamera.addEventListener('click', async () => {
            btnFlipCamera.classList.add('animate-spin');
            await toggleCameraFacing();
            setTimeout(() => btnFlipCamera.classList.remove('animate-spin'), 600);
        });
    }

    // 4. Retry Camera Permission Button
    if (btnRetryCamera) {
        btnRetryCamera.addEventListener('click', () => {
            initCameraStream(currentFacingMode, true);
        });
    }

    // 5. Start Photo Session
    if (btnMulaiFoto) {
        btnMulaiFoto.addEventListener('click', () => {
            waktuTimer = parseInt(document.getElementById('settingTimer').value);
            totalFoto = parseInt(document.getElementById('settingSnaps').value);
            if (settingsBar) settingsBar.classList.add('hide'); 
            if (photoCounter) photoCounter.classList.remove('hide');
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = ''; 
                thumbnailContainer.classList.add('capturing'); 
            }
            jepretanKe = 0; 
            frameUntukGif = []; 
            liveVideos = [];
            liveVideoBlobs = [];
            retakeIndex = -1; 
            if (btnContinue) btnContinue.classList.add('hide');
            mulaiCountdown();
        });
    }

    // 6. Continue Camera -> Frame Builder
    if (btnContinue && stateCamera && stateBuilder) {
        btnContinue.addEventListener('click', () => {
            stateCamera.classList.add('hide'); 
            if (mainAppHeader) mainAppHeader.classList.remove('hide');
            stateBuilder.classList.remove('hide');
            deactivateCameraView();
            setupBuilder();
        });
    }

    // 7. Tabs in Frame Builder (Frames vs Filters)
    if (tabFrameBtn && tabFilterBtn && frameList && filterList) {
        tabFrameBtn.onclick = () => {
            tabFrameBtn.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-black text-white bg-blue-600 shadow-md transition flex items-center justify-center gap-2';
            tabFilterBtn.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center justify-center gap-2';
            frameList.classList.remove('hide'); 
            const categoryWrapper = document.getElementById('frameCategoryPills');
            if (categoryWrapper && categoryWrapper.parentElement) categoryWrapper.parentElement.classList.remove('hide');
            filterList.classList.add('hide');
        };

        tabFilterBtn.onclick = () => {
            tabFilterBtn.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-black text-white bg-blue-600 shadow-md transition flex items-center justify-center gap-2';
            tabFrameBtn.className = 'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition flex items-center justify-center gap-2';
            filterList.classList.remove('hide'); 
            const categoryWrapper = document.getElementById('frameCategoryPills');
            if (categoryWrapper && categoryWrapper.parentElement) categoryWrapper.parentElement.classList.add('hide');
            frameList.classList.add('hide');
        };
    }

    // 8. Camera Live Filter Select
    if (settingFilter && video) {
        settingFilter.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            video.style.filter = filters[currentFilter].css;
        });
    }
}

// Reset photo session smoothly without reloading page / re-requesting permissions
function restartPhotoSession() {
    const stateAdmin = document.getElementById('state-admin');
    const stateLanding = document.getElementById('state-landing');
    const stateInstructions = document.getElementById('state-instructions');
    const stateCamera = document.getElementById('state-camera');
    const stateBuilder = document.getElementById('state-builder');
    const stateResults = document.getElementById('state-results');
    const loadingResults = document.getElementById('loadingResults');
    const masterActionBar = document.getElementById('masterActionBar');
    const resultsGrid = document.getElementById('resultsGrid');
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    const photoCounter = document.getElementById('photoCounter');
    const settingsBar = document.getElementById('settingsBar');
    const btnContinue = document.getElementById('btnContinue');
    const mainAppHeader = document.getElementById('mainAppHeader');

    // Reset session data
    jepretanKe = 0;
    frameUntukGif = [];
    liveVideos = [];
    liveVideoBlobs = [];
    retakeIndex = -1;
    activeSelectedPhotoIdx = null;

    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = '';
        thumbnailContainer.classList.remove('capturing');
    }
    if (photoCounter) photoCounter.classList.add('hide');
    if (settingsBar) settingsBar.classList.remove('hide');
    if (btnContinue) btnContinue.classList.add('hide');
    if (loadingResults) loadingResults.classList.add('hide');
    if (masterActionBar) masterActionBar.classList.add('hide');
    if (resultsGrid) resultsGrid.classList.add('hide');

    // Hide subsequent states & admin
    if (stateAdmin) stateAdmin.classList.add('hide');
    if (stateResults) stateResults.classList.add('hide');
    if (stateBuilder) stateBuilder.classList.add('hide');
    if (stateCamera) stateCamera.classList.add('hide');
    if (stateInstructions) stateInstructions.classList.add('hide');

    // Show landing & header
    if (mainAppHeader) mainAppHeader.classList.remove('hide');
    if (stateLanding) {
        stateLanding.classList.remove('hide');
        stateLanding.style.opacity = '1';
    }

    // Re-apply theme background
    if (typeof ThemeManager !== 'undefined' && ThemeManager.applyConfig) {
        ThemeManager.applyConfig(ThemeManager.getConfig());
    }

    // Ensure camera track is alive
    if (streamActive) {
        streamActive.getVideoTracks().forEach(track => track.enabled = true);
    }
}

window.restartPhotoSession = restartPhotoSession;

// Window resize & tablet orientation change listener
function handleViewportRelayout() {
    const stateBuilder = document.getElementById('state-builder');
    const customFrameModal = document.getElementById('customFrameModal');
    if (stateBuilder && !stateBuilder.classList.contains('hide') && typeof adjustFrameScale === 'function') {
        adjustFrameScale();
    }
    if (customFrameModal && !customFrameModal.classList.contains('hide') && typeof adjustCustomStageScale === 'function') {
        adjustCustomStageScale();
    }
}

window.addEventListener('resize', handleViewportRelayout);
window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportRelayout, 150);
});
