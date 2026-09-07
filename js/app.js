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

    // 4. Pre-warm / Request Camera Stream
    try {
        await initCameraStream();
    } catch (err) { 
        console.warn("Kamera belum aktif atau perlu izin gesture pengguna."); 
    }

    // 5. Bind Main Navigation Flow
    bindAppNavigation();
});

function bindAppNavigation() {
    const stateLanding = document.getElementById('state-landing');
    const stateInstructions = document.getElementById('state-instructions');
    const stateCamera = document.getElementById('state-camera');
    const stateBuilder = document.getElementById('state-builder');
    
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

    // 1. Landing -> Instructions
    if (btnLanding && stateLanding && stateInstructions) {
        btnLanding.addEventListener('click', () => {
            // Warm up camera on user gesture
            initCameraStream();

            stateLanding.style.opacity = '0';
            setTimeout(() => { 
                stateLanding.classList.add('hide'); 
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
            initCameraStream();
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
            stateBuilder.classList.remove('hide');
            deactivateCameraView();
            if (streamActive) {
                streamActive.getVideoTracks().forEach(track => track.enabled = false);
            }
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

// Window resize listener
window.addEventListener('resize', () => { 
    const stateBuilder = document.getElementById('state-builder');
    const customFrameModal = document.getElementById('customFrameModal');
    if (stateBuilder && !stateBuilder.classList.contains('hide')) adjustFrameScale(); 
    if (customFrameModal && !customFrameModal.classList.contains('hide')) adjustCustomStageScale();
});
