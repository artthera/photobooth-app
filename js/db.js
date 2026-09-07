/**
 * Photobooth Pro - IndexedDB Storage Client
 * Fitur: Menyimpan dan memuat template frame serta sesi foto pelanggan secara permanen di browser pengguna.
 */

const PhotoboothDB = (function() {
    const DB_NAME = 'PhotoboothDB_v1';
    const DB_VERSION = 2; // Upgraded to v2 for sessions store
    const STORE_FRAMES = 'frames';
    const STORE_SESSIONS = 'sessions';
    let dbPromise = null;

    function getDB() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_FRAMES)) {
                        db.createObjectStore(STORE_FRAMES, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
                        const sessStore = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
                        sessStore.createIndex('createdAt', 'createdAt', { unique: false });
                    }
                };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error);
            });
        }
        return dbPromise;
    }

    // ================= FRAME METHODS =================
    async function getAllFrames() {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_FRAMES, 'readonly');
                const store = tx.objectStore(STORE_FRAMES);
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error);
            });
        } catch(e) {
            console.error("FrameDB getAll error:", e);
            return [];
        }
    }

    async function saveFrame(frame) {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_FRAMES, 'readwrite');
                const store = tx.objectStore(STORE_FRAMES);
                const req = store.put(frame);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
        } catch(e) {
            console.error("FrameDB save error:", e);
            return false;
        }
    }

    async function deleteFrame(id) {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_FRAMES, 'readwrite');
                const store = tx.objectStore(STORE_FRAMES);
                const req = store.delete(id);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
        } catch(e) {
            console.error("FrameDB delete error:", e);
            return false;
        }
    }

    async function saveAllFrames(framesList) {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_FRAMES, 'readwrite');
                const store = tx.objectStore(STORE_FRAMES);
                store.clear();
                framesList.forEach(f => store.put(f));
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error);
            });
        } catch(e) {
            console.error("FrameDB saveAll error:", e);
            return false;
        }
    }

    // ================= SESSION METHODS =================
    async function saveSession(sessionData) {
        if (!sessionData || !sessionData.id) return false;
        try {
            // 1. Save to IndexedDB
            const db = await getDB();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_SESSIONS, 'readwrite');
                const store = tx.objectStore(STORE_SESSIONS);
                const req = store.put(sessionData);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });

            // 2. Save latest ID & lightweight meta in localStorage
            try {
                localStorage.setItem('photobooth_latest_session_id', sessionData.id);
                const meta = {
                    id: sessionData.id,
                    createdAt: sessionData.createdAt || Date.now(),
                    dateStr: sessionData.dateStr || '',
                    brandName: sessionData.brandName || 'Eazy Fotobooth',
                    gdriveUrl: sessionData.gdriveUrl || null,
                    frameName: sessionData.frameName || 'Photo Strip',
                    totalShots: sessionData.totalShots || 0
                };
                localStorage.setItem('photobooth_latest_session_meta', JSON.stringify(meta));
            } catch (lsErr) {
                console.warn("LocalStorage meta save warning:", lsErr);
            }

            return true;
        } catch (e) {
            console.error("SessionDB save error:", e);
            return false;
        }
    }

    async function getSession(id) {
        if (!id) return null;
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_SESSIONS, 'readonly');
                const store = tx.objectStore(STORE_SESSIONS);
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.error("SessionDB get error:", e);
            return null;
        }
    }

    async function getLatestSession() {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_SESSIONS, 'readonly');
                const store = tx.objectStore(STORE_SESSIONS);
                const req = store.getAll();
                req.onsuccess = () => {
                    const list = req.result || [];
                    if (list.length === 0) return resolve(null);
                    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    resolve(list[0]);
                };
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.error("SessionDB getLatest error:", e);
            return null;
        }
    }

    async function getAllSessions() {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_SESSIONS, 'readonly');
                const store = tx.objectStore(STORE_SESSIONS);
                const req = store.getAll();
                req.onsuccess = () => {
                    const list = req.result || [];
                    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                    resolve(list);
                };
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.error("SessionDB getAll error:", e);
            return [];
        }
    }

    async function deleteSession(id) {
        if (!id) return false;
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_SESSIONS, 'readwrite');
                const store = tx.objectStore(STORE_SESSIONS);
                const req = store.delete(id);
                req.onsuccess = () => resolve(true);
                req.onerror = () => reject(req.error);
            });
        } catch (e) {
            console.error("SessionDB delete error:", e);
            return false;
        }
    }

    return {
        // Frames
        getAllFrames,
        saveFrame,
        deleteFrame,
        saveAllFrames,
        // Sessions
        saveSession,
        getSession,
        getLatestSession,
        getAllSessions,
        deleteSession
    };
})();

// Backward compatibility alias for FrameDB
const FrameDB = PhotoboothDB;
const SessionDB = PhotoboothDB;

