/**
 * Photobooth Pro - Storage Adapter & Backend API Abstraction
 * Allows seamless switching between LocalStorage, REST API, Firebase, Supabase, or Cloudflare R2
 */

// 1. Storage Adapter Base Interface
class BaseStorageAdapter {
  async createSession(sessionData) { throw new Error('Not implemented'); }
  async getSession(sessionId) { throw new Error('Not implemented'); }
  async deleteExpiredSessions(maxAgeHours) { throw new Error('Not implemented'); }
}

// 2. LocalStorage Adapter (Default for standalone/offline events)
class LocalStorageAdapter extends BaseStorageAdapter {
  constructor(storageKey = 'photobooth_cloud_sessions_v1') {
    super();
    this.storageKey = storageKey;
  }

  _getAll() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('[LocalStorageAdapter] Failed to parse storage:', e);
      return {};
    }
  }

  _saveAll(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('[LocalStorageAdapter] Storage quota exceeded or error:', e);
      return false;
    }
  }

  async createSession(sessionData) {
    const all = this._getAll();
    all[sessionData.sessionId] = {
      ...sessionData,
      createdAt: sessionData.timestamp || Date.now()
    };
    this._saveAll(all);
    return { success: true, sessionId: sessionData.sessionId };
  }

  async getSession(sessionId) {
    const all = this._getAll();
    const session = all[sessionId];
    if (!session) return null;
    return session;
  }

  async deleteExpiredSessions(maxAgeHours = 24) {
    const all = this._getAll();
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let changed = false;

    for (const id in all) {
      if (now - (all[id].createdAt || now) > maxAgeMs) {
        delete all[id];
        changed = true;
      }
    }

    if (changed) this._saveAll(all);
    return { success: true };
  }
}

// 3. REST API Adapter (Ready for Supabase, Firebase, Cloudflare R2, or Custom Backend)
class RESTApiAdapter extends BaseStorageAdapter {
  constructor(endpoint, apiKey = '') {
    super();
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async createSession(sessionData) {
    const response = await fetch(`${this.endpoint}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  }

  async getSession(sessionId) {
    const response = await fetch(`${this.endpoint}/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      }
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

    return await response.json();
  }

  async deleteExpiredSessions(maxAgeHours = 24) {
    const response = await fetch(`${this.endpoint}/sessions/cleanup?maxAgeHours=${maxAgeHours}`, {
      method: 'DELETE',
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      }
    });
    return response.ok;
  }
}

// Factory Function
window.StorageClient = (function(){
  function getAdapter(type = 'local', options = {}) {
    if (type === 'rest' && options.endpoint) {
      return new RESTApiAdapter(options.endpoint, options.apiKey);
    }
    return new LocalStorageAdapter(options.storageKey || window.PhotoboothConfig.SESSION_STORE_KEY);
  }

  return {
    getAdapter,
    LocalStorageAdapter,
    RESTApiAdapter
  };
})();
