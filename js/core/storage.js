const KEY = 'steeltrack_pro_v11';

class Storage {
    save(data) { try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch(e) { return false; } }
    load() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch(e) { return null; } }
    getUser() { try { const u = localStorage.getItem('steeltrack_user'); return u ? JSON.parse(u) : null; } catch(e) { return null; } }
    setUser(u) { localStorage.setItem('steeltrack_user', JSON.stringify(u)); }
    clearUser() { localStorage.removeItem('steeltrack_user'); }
    clear() { localStorage.removeItem(KEY); localStorage.removeItem('steeltrack_user'); }
}

export const storage = new Storage();