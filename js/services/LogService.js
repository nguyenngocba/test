import { appState } from '../core/state.js';

class LogService {
    addLog(action, details) {
        if (!appState.getCurrentUser()) return;
        const user = appState.getCurrentUser();
        appState.addLog({
            id: `LOG${String(appState._data.nextLogId++).padStart(5, '0')}`,
            timeStr: new Date().toLocaleString('vi-VN'),
            userName: user.name, action, details: details || ''
        });
    }
}

export const logService = new LogService();