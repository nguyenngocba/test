const STORAGE_KEY = 'steeltrack_pro_v10';

class Storage {
    save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error('Storage load error:', e);
            return null;
        }
    }

    getUser() {
        try {
            const user = localStorage.getItem('steeltrack_current_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    }

    setUser(user) {
        localStorage.setItem('steeltrack_current_user', JSON.stringify(user));
    }

    clearUser() {
        localStorage.removeItem('steeltrack_current_user');
    }

    clear() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('steeltrack_current_user');
    }
}

export const storage = new Storage();