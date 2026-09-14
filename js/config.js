/**
 * Photobooth Pro - Global Config & Presets
 * Fitur: Konfigurasi default, daftar filter foto, dan template frame bawaan.
 */

// Dimensi foto mentah dari kamera
const lebarFoto = 900;
const tinggiFoto = 675;

// ================= DAFTAR FILTER FOTO (CSS & Canvas Filter) =================
const filters = {
    'none': { name: 'RAW', css: 'none', canvasFilter: 'none' },
    'bw': { name: 'MONOCHROME', css: 'grayscale(100%) contrast(150%)', canvasFilter: 'grayscale(100%) contrast(150%)' },
    'fisheye': { name: 'CCTV / SECURITY', css: 'url(#fisheye-filter) saturate(0) contrast(1.5)', canvasFilter: 'url(#fisheye-filter) saturate(0) contrast(1.5)' },
    'glitch': { name: 'SYS_FAILURE', css: 'url(#glitch-filter) contrast(1.2) saturate(1.5)', canvasFilter: 'url(#glitch-filter) contrast(1.2) saturate(1.5)' },
    'thermal': { name: 'THERMAL SCAN', css: 'url(#thermal-filter)', canvasFilter: 'url(#thermal-filter)' },
    'posterize': { name: 'X-RAY INVERT', css: 'url(#posterize-filter) grayscale(100%) invert(100%) contrast(150%)', canvasFilter: 'url(#posterize-filter) grayscale(100%) invert(100%) contrast(150%)' },
    'neon': { name: 'EDGE DETECT', css: 'url(#neon-edge)', canvasFilter: 'url(#neon-edge)' },
    'noise': { name: 'STATIC NOISE', css: 'url(#noise-filter) grayscale(100%) contrast(200%) brightness(80%)', canvasFilter: 'url(#noise-filter) grayscale(100%) contrast(200%) brightness(80%)' },
    'liquid': { name: 'DISTORTION', css: 'url(#liquid-filter) grayscale(100%) contrast(130%)', canvasFilter: 'url(#liquid-filter) grayscale(100%) contrast(130%)' }
};

// ================= TEMPLATE FRAME BAWAAN (BUILT-IN) =================
const builtInFrames = [
    { 
        id: 'korean_white_4', 
        name: 'Korean White (4 Cuts)', 
        width: 360, 
        height: 980, 
        slotCount: 4,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-white text-black p-5 relative flex flex-col justify-between font-sans select-none border border-gray-200 box-border">
            <div class="flex justify-between items-center px-1 pb-1 shrink-0">
                <span class="text-[11px] font-black tracking-widest uppercase">EAZY FOTOBOOTH</span>
                <span class="text-[10px] font-bold text-gray-500">2026.08.22</span>
            </div>
            <div class="flex flex-col gap-3.5 flex-grow my-2 min-h-0">
                <div class="drop-slot bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="1">1</div>
                <div class="drop-slot bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="2">2</div>
                <div class="drop-slot bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="3">3</div>
                <div class="drop-slot bg-gray-100 border border-gray-300 flex items-center justify-center text-gray-400 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="4">4</div>
            </div>
            <div class="text-center pt-2 border-t border-gray-200 shrink-0">
                <div class="text-xs font-black tracking-widest uppercase">&hearts; SWEET MEMORIES &hearts;</div>
                <div class="text-[9px] text-gray-400 tracking-wider mt-0.5">Life is beautiful with you</div>
            </div>
        </div>` 
    },
    { 
        id: 'korean_black_4', 
        name: 'Korean Matte Black (4 Cuts)', 
        width: 360, 
        height: 980, 
        slotCount: 4,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-[#111116] text-white p-5 relative flex flex-col justify-between font-sans select-none border border-gray-800 box-border">
            <div class="flex justify-between items-center px-1 pb-1 shrink-0">
                <span class="text-[11px] font-black tracking-widest text-gray-200 uppercase">STUDIO CUT</span>
                <span class="text-[10px] font-bold text-gray-400">#MOMENTS</span>
            </div>
            <div class="flex flex-col gap-3.5 flex-grow my-2 min-h-0">
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="1">1</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="2">2</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="3">3</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-4xl font-black rounded-lg overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="4">4</div>
            </div>
            <div class="text-center pt-2 border-t border-gray-800 shrink-0">
                <div class="text-xs font-black tracking-widest text-gray-300 uppercase">ALWAYS TOGETHER</div>
                <div class="text-[9px] text-gray-500 tracking-wider mt-0.5">Capturing raw & live moments</div>
            </div>
        </div>` 
    },
    { 
        id: 'receipt_4', 
        name: 'Receipt Style (4 Slots)', 
        width: 440, 
        height: 740, 
        slotCount: 4,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-white text-black p-5 relative flex flex-col justify-between font-sans select-none border border-gray-300 box-border">
            <div class="text-center font-black text-2xl border-b-4 border-black pb-1 mb-2 tracking-tighter shrink-0">SERVING SIZE : 1 Heart &hearts;</div>
            <div class="text-[9px] uppercase font-bold mb-2 leading-tight tracking-wider text-gray-700 shrink-0">Ingredients: Love, Laughter, Warm Hugs, Trust, Communication, Time, Whole World.</div>
            <div class="grid grid-cols-2 gap-2.5 flex-grow min-h-0 my-1">
                <div class="drop-slot bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-3xl font-black rounded-lg overflow-hidden transition-all relative min-h-0" data-slot="1">1</div>
                <div class="drop-slot bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-3xl font-black rounded-lg overflow-hidden transition-all relative min-h-0" data-slot="2">2</div>
                <div class="drop-slot bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-3xl font-black rounded-lg overflow-hidden transition-all relative min-h-0" data-slot="3">3</div>
                <div class="drop-slot bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-400 text-3xl font-black rounded-lg overflow-hidden transition-all relative min-h-0" data-slot="4">4</div>
            </div>
            <div class="mt-2 border-t-4 border-black pt-2 shrink-0">
                <div class="text-[10px] font-bold uppercase mb-0.5">Nutrition &hearts; 100% PURE JOY</div>
                <div class="flex justify-between font-black text-lg items-center">
                    <span>TOTAL : FOREVER</span>
                    <div class="w-32 h-8 bg-black overflow-hidden flex flex-col" style="background: repeating-linear-gradient(90deg, #000, #000 3px, transparent 3px, transparent 6px);"></div>
                </div>
            </div>
        </div>` 
    },
    { 
        id: 'cinema_red_3', 
        name: 'Red Cinema Film (3 Slots)', 
        width: 360, 
        height: 820, 
        slotCount: 3,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-[#B31B1B] p-5 relative flex flex-col justify-between font-sans select-none border-x-[12px] border-x-[#6c1010] shadow-inner box-border">
            <div class="text-white text-center font-black text-xl tracking-[0.25em] bg-[#8B0000] py-1.5 rounded-lg shadow-sm shrink-0">CINEMA FILM</div>
            <div class="flex flex-col gap-3 flex-grow min-h-0 my-2">
                <div class="drop-slot bg-white w-full flex-1 min-h-0 border-2 border-dashed border-red-300 flex items-center justify-center text-red-300 text-5xl font-black rounded-xl shadow-md overflow-hidden transition-all relative" data-slot="1">1</div>
                <div class="drop-slot bg-white w-full flex-1 min-h-0 border-2 border-dashed border-red-300 flex items-center justify-center text-red-300 text-5xl font-black rounded-xl shadow-md overflow-hidden transition-all relative" data-slot="2">2</div>
                <div class="drop-slot bg-white w-full flex-1 min-h-0 border-2 border-dashed border-red-300 flex items-center justify-center text-red-300 text-5xl font-black rounded-xl shadow-md overflow-hidden transition-all relative" data-slot="3">3</div>
            </div>
            <div class="text-white text-center font-bold text-[10px] tracking-widest bg-[#8B0000] py-1.5 rounded-lg shrink-0">&copy; PHOTOBOOTH &bull; LIVE MEMORIES</div>
        </div>` 
    },
    { 
        id: 'blue_grid_4', 
        name: 'Modern 2x2 Grid (4 Slots)', 
        width: 460, 
        height: 600, 
        slotCount: 4,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-[#1E3A8A] p-5 relative flex flex-col justify-between font-sans text-white select-none box-border">
            <div class="grid grid-cols-2 gap-3 flex-grow min-h-0 mb-3">
                <div class="drop-slot bg-white/10 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-200 text-4xl font-black rounded-xl overflow-hidden transition-all shadow-inner relative min-h-0" data-slot="1">1</div>
                <div class="drop-slot bg-white/10 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-200 text-4xl font-black rounded-xl overflow-hidden transition-all shadow-inner relative min-h-0" data-slot="2">2</div>
                <div class="drop-slot bg-white/10 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-200 text-4xl font-black rounded-xl overflow-hidden transition-all shadow-inner relative min-h-0" data-slot="3">3</div>
                <div class="drop-slot bg-white/10 border-2 border-dashed border-blue-300 flex items-center justify-center text-blue-200 text-4xl font-black rounded-xl overflow-hidden transition-all shadow-inner relative min-h-0" data-slot="4">4</div>
            </div>
            <div class="text-center pt-1 shrink-0 flex flex-col items-center">
                <div class="text-2xl font-black italic tracking-wider">GOOD VIBES ONLY</div>
                <div class="text-[10px] text-blue-200 tracking-widest mt-0.5">Live Life In Full Motion</div>
            </div>
        </div>` 
    },
    { 
        id: 'pastel_y2k_4', 
        name: 'Pastel Y2K Sparkle (4 Slots)', 
        width: 360, 
        height: 840, 
        slotCount: 4,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-gradient-to-b from-[#ffcbf2] via-[#e2afff] to-[#c8e7ff] p-4 relative flex flex-col justify-between font-sans text-[#4a154b] select-none border-4 border-white shadow-xl box-border">
            <div class="flex justify-between items-center px-1 pb-1 shrink-0">
                <span class="text-[10px] font-black tracking-widest bg-white/90 px-3 py-0.5 rounded-full shadow-sm">&star; LUCKY STAR &star;</span>
                <span class="text-[10px] font-bold text-pink-800">2026.08.22</span>
            </div>
            <div class="flex flex-col gap-2.5 flex-grow my-2 min-h-0">
                <div class="drop-slot bg-white/70 border-2 border-dashed border-pink-400 flex items-center justify-center text-pink-400 text-4xl font-black rounded-xl shadow-sm overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="1">1</div>
                <div class="drop-slot bg-white/70 border-2 border-dashed border-pink-400 flex items-center justify-center text-pink-400 text-4xl font-black rounded-xl shadow-sm overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="2">2</div>
                <div class="drop-slot bg-white/70 border-2 border-dashed border-pink-400 flex items-center justify-center text-pink-400 text-4xl font-black rounded-xl shadow-sm overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="3">3</div>
                <div class="drop-slot bg-white/70 border-2 border-dashed border-pink-400 flex items-center justify-center text-pink-400 text-4xl font-black rounded-xl shadow-sm overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="4">4</div>
            </div>
            <div class="text-center font-black text-xs tracking-widest uppercase bg-white/80 py-1.5 rounded-lg shadow-sm shrink-0">
                SWEET MOMENTS CLUB
            </div>
        </div>` 
    },
    { 
        id: 'film_strip_5', 
        name: 'Minimalist 5-Cut Film (5 Slots)', 
        width: 360, 
        height: 1080, 
        slotCount: 5,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-[#18181b] text-white p-4 relative flex flex-col justify-between font-sans select-none border-2 border-gray-800 box-border">
            <div class="text-center font-black text-xs tracking-widest text-gray-300 uppercase pb-1 border-b border-gray-800 shrink-0">
                FILM STRIP &bull; 5 SHOTS
            </div>
            <div class="flex flex-col gap-2.5 flex-grow my-2 min-h-0">
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-3xl font-black rounded-md overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="1">1</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-3xl font-black rounded-md overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="2">2</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-3xl font-black rounded-md overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="3">3</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-3xl font-black rounded-md overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="4">4</div>
                <div class="drop-slot bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-3xl font-black rounded-md overflow-hidden flex-1 min-h-0 transition-all relative" data-slot="5">5</div>
            </div>
            <div class="text-center pt-1 border-t border-gray-800 text-[9px] text-gray-500 font-mono shrink-0">
                ISO 400 &bull; EXP 2026
            </div>
        </div>` 
    },
    { 
        id: 'polaroid_trio_3', 
        name: 'Polaroid Trio (3 Slots)', 
        width: 380, 
        height: 850, 
        slotCount: 3,
        isBuiltIn: true,
        html: `<div class="w-full h-full bg-[#f8f6f0] text-black p-4 relative flex flex-col justify-between font-sans select-none border border-gray-300 box-border">
            <div class="text-center font-bold text-xs tracking-widest text-gray-600 uppercase mb-1 shrink-0">
                SNAPSHOTS &hearts;
            </div>
            <div class="flex flex-col gap-3 flex-grow min-h-0">
                <div class="bg-white p-2.5 pb-6 rounded-md shadow-md flex flex-col flex-1 min-h-0 border border-gray-200">
                    <div class="drop-slot bg-gray-100 flex-grow w-full h-full flex items-center justify-center text-gray-400 text-3xl font-black rounded overflow-hidden transition-all relative min-h-0" data-slot="1">1</div>
                </div>
                <div class="bg-white p-2.5 pb-6 rounded-md shadow-md flex flex-col flex-1 min-h-0 border border-gray-200">
                    <div class="drop-slot bg-gray-100 flex-grow w-full h-full flex items-center justify-center text-gray-400 text-3xl font-black rounded overflow-hidden transition-all relative min-h-0" data-slot="2">2</div>
                </div>
                <div class="bg-white p-2.5 pb-6 rounded-md shadow-md flex flex-col flex-1 min-h-0 border border-gray-200">
                    <div class="drop-slot bg-gray-100 flex-grow w-full h-full flex items-center justify-center text-gray-400 text-3xl font-black rounded overflow-hidden transition-all relative min-h-0" data-slot="3">3</div>
                </div>
            </div>
            <div class="text-center font-handwriting text-xl text-gray-700 mt-1 shrink-0">
                Memories that last forever
            </div>
        </div>` 
    }
];
