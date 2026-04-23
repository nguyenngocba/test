import { appState } from '../core/state.js';

class LogService {
    addLog(action, details = '') {
        if (!appState.getCurrentUser()) return;
        
        const currentUser = appState.getCurrentUser();
        const nextId = appState._data.nextLogId || 1;
        
        const logEntry = {
            id: `LOG${String(nextId).padStart(5, '0')}`,
            timestamp: new Date().toISOString(),
            timeStr: new Date().toLocaleString('vi-VN'),
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            action: action,
            details: details
        };
        
        appState._data.nextLogId = nextId + 1;
        appState.addLog(logEntry);
    }

    getAllLogs(limit = 200) {
        return appState.logs.slice(0, limit);
    }

    getLogsByUser(userId, limit = 100) {
        return appState.logs.filter(l => l.userId === userId).slice(0, limit);
    }

    getLogsByAction(action, limit = 100) {
        return appState.logs.filter(l => l.action === action).slice(0, limit);
    }

    getLogsByDateRange(startDate, endDate) {
        return appState.logs.filter(l => {
            const logDate = l.timestamp.split('T')[0];
            return logDate >= startDate && logDate <= endDate;
        });
    }

    clearLogs() {
        appState._data.logs = [];
        appState._save();
        this.addLog('Xóa log', 'Đã xóa toàn bộ nhật ký hệ thống');
    }
}

export const logService = new LogService();