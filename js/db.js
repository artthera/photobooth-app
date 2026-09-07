/**
 * Photobooth Pro - IndexedDB Storage Client
 * Fitur: Menyimpan dan memuat template frame secara permanen di browser pengguna.
 */

const FrameDB = (function() {
    const DB_NAME = 'PhotoboothDB_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'frames';
    let dbPromise = null;

    function getDB() {
        if (!dbPromise) {
            dbPromise = new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_NAME)) {
                        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    }
                };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error);
            });
        }
        return dbPromise;
    }

    async function getAllFrames() {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
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
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
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
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
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
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
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

    return {
        getAllFrames,
        saveFrame,
        deleteFrame,
        saveAllFrames
    };
})();
